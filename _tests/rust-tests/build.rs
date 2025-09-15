use cargo_build as cargo;

use std::{io::BufRead, path::Path};

fn main() -> std::io::Result<()> {
    let posts_folder = "../../_posts";

    cargo::rerun_if_changed(posts_folder);

    type ModName = String;
    type ModText = String;

    let mut generated_docs: Vec<(ModName, ModText)> = Vec::new();

    let posts = std::fs::read_dir(posts_folder)?;

    for post in posts {
        let post = post?;
        let post_text = std::fs::read(post.path())?;

        let mut generated_post_text: String = post_text
            .lines()
            .map(|line| format!("/// {}\n", line.unwrap()))
            .collect();

        let post_mod_name = post.file_name().into_string().unwrap();
        let post_mod_name = &post_mod_name.replace("-", "_")[..post_mod_name.len() - 3];

        generated_post_text.push_str(&format!("mod mod_{} {{}}\n", post_mod_name));

        generated_docs.push((post_mod_name.to_string(), generated_post_text));
    }

    let out_dir: String = std::env::var("OUT_DIR").unwrap();

    for (mod_name, mod_text) in &generated_docs {
        let generated_mod_file = Path::new(&out_dir).join(&format!("generated_{}.rs", mod_name));
        std::fs::write(&generated_mod_file, mod_text)?;
    }

    let lib_rs_text: String = generated_docs
        .iter()
        .map(|(mod_name, _)| format!("mod generated_{};\n", mod_name))
        .collect();

    let generated_lib_rs = Path::new(&out_dir).join("generated_lib.rs");

    std::fs::write(&generated_lib_rs, lib_rs_text)?;

    Ok(())
}

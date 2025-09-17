use cargo_build as cargo;

use std::path::Path;

type ModName = String;
type ModText = String;

fn main() -> std::io::Result<()> {
    let posts_folder = "../content/";

    cargo::rerun_if_changed("always");

    let mut generated_docs: Vec<(ModName, ModText)> = Vec::new();


    for file in walkdir::WalkDir::new(posts_folder) {
        let file = file?;
        let file_path = file.path().to_str().unwrap();

        if file.path().extension().unwrap_or_default() == "md" {
            let pretty_post_name = file_path
                .replace(" ", "_")
                .replace("-", "_")
                .replace("/", "_")
                .replace("\\", "_")
                .replace(".", "_");

            let pretty_post_name = &pretty_post_name[11..pretty_post_name.len() - 3];

            let post_text = std::fs::read_to_string(file.path())?;

            let mut pretty_post_text: String = post_text
                .lines()
                .map(|line| {
                    format!("/// {}\n", line)
                })
                .collect();

            pretty_post_text.push_str(&format!(
                "#[allow(non_snake_case)] mod {} {{}}\n",
                pretty_post_name
            ));

            generated_docs.push((pretty_post_name.to_string(), pretty_post_text));
        }
    }

    let out_dir: String = std::env::var("OUT_DIR").unwrap();

    for (mod_name, mod_text) in &generated_docs {
        let generated_mod_file = Path::new(&out_dir).join(&format!("{}.rs", mod_name));
        std::fs::write(&generated_mod_file, mod_text)?;
    }

    let lib_rs_text: String = generated_docs
        .iter()
        .map(|(mod_name, _)| format!("#[allow(non_snake_case)] mod {};\n", mod_name))
        .collect();

    let generated_lib_rs = Path::new(&out_dir).join("generated_lib.rs");

    std::fs::write(&generated_lib_rs, lib_rs_text)?;
    
    Ok(())
}

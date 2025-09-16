use cargo_build as cargo;

use std::{io::BufRead, path::Path};

type ModName = String;
type ModText = String;

fn main() -> std::io::Result<()> {
    let posts_folder = "../content/blog/";

    cargo::rerun_if_changed("always");

    let mut generated_docs: Vec<(ModName, ModText)> = Vec::new();

    let posts = std::fs::read_dir(posts_folder)?;

    for post in posts {
        let post = post?;
        if post.file_type().unwrap().is_dir() {
            let dir_name = post.file_name().into_string().unwrap();

            println!("dir: {dir_name}");

            let posts = std::fs::read_dir(posts_folder)?;
            
            for post in posts {
                let post = post?;
                println!("file: {}", post.file_name().into_string().unwrap());
                if post.path().extension().unwrap_or_default() == "md" {
                    let post_name = post.file_name().into_string().unwrap();
                    let post_name = format!("{dir_name}_{post_name}");
                    let post_text = std::fs::read(post.path())?;

                    let mut generated_post_text: String = post_text
                        .lines()
                        .map(|line| format!("/// {}\n", line.unwrap()))
                        .collect();

                    let post_mod_name =
                        &post_name.replace("-", "_").replace(" ", "_")[..post_name.len() - 3];
                    generated_post_text.push_str(&format!("#[allow(non_snake_case)] mod mod_{} {{}}\n", post_mod_name));
                    generated_docs.push((post_mod_name.to_string(), generated_post_text));
                }
            }
        } else if post.path().extension().unwrap_or_default() == "md" {
            let post_name = post.file_name().into_string().unwrap();
            let post_text = std::fs::read(post.path())?;

            let mut generated_post_text: String = post_text
                .lines()
                .map(|line| format!("/// {}\n", line.unwrap()))
                .collect();

            let post_mod_name =
                &post_name.replace("-", "_").replace(" ", "_")[..post_name.len() - 3];
            generated_post_text.push_str(&format!("#[allow(non_snake_case)] mod mod_{} {{}}\n", post_mod_name));
            generated_docs.push((post_mod_name.to_string(), generated_post_text));
        } else {
            continue;
        }
    }

    let out_dir: String = std::env::var("OUT_DIR").unwrap();

    for (mod_name, mod_text) in &generated_docs {
        let generated_mod_file = Path::new(&out_dir).join(&format!("file_{}.rs", mod_name));
        std::fs::write(&generated_mod_file, mod_text)?;
    }

    let lib_rs_text: String = generated_docs
        .iter()
        .map(|(mod_name, _)| format!("#[allow(non_snake_case)] mod file_{};\n", mod_name))
        .collect();

    let generated_lib_rs = Path::new(&out_dir).join("generated_lib.rs");

    std::fs::write(&generated_lib_rs, lib_rs_text)?;

    Ok(())
}

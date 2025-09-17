fn main() {
    cargo_build::rustc_link_arg!(
        bin "client": "stack-size=", { 8 * 1024 * 1024 }
    );
}



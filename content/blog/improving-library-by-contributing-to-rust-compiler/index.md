+++
title = "Improving my library by contributing to Rust compiler"
description = "My crate [`cargo-build`](https://github.com/IoaNNUwU/cargo-build) is a wrapper around `cargo` instructions available in build script `build.rs`. It makes heavy use of macros which leads to bad error messages. My pull request improved error messages inside Rust's standard library (including `println!` and `write!` macros) which improved error messages inside my library as well. Interestingly enough, there was no need to change crate's code."
date = 2025-09-17
# updated = 2025-09-17

[taxonomies]
tags = ["build-rs", "cargo-build", "rustc"]
categories = ["rust", "project"]
+++

### Improving my library by contributing to Rust compiler

My crate [`cargo-build`](https://github.com/IoaNNUwU/cargo-build) is a wrapper around `cargo` instructions available in build script `build.rs`. 

Here is a quick example:

```rust
cargo_build::rustc_check_cfg("api_version", ["1", "2", "3"]);
cargo_build::rustc_cfg(("api_version", "1"));

cargo_build::rustc_link_lib!(
    static: "+whole-archive", "+verbatim", "+bundle" =
      "nghttp2";
      "libssl";
      "libcrypto";
      "mylib:{}", "renamed_lib";
);
let env_var = "HOST";
if std::env::var("HOST").is_ok() {
    cargo_build::warning!("Warning during compilation: {} is not set", env_var);
    cargo_build::error!("Unable to finish compilation: {} is not set", env_var);
}
```

It makes heavy use of macros which leads to bad error messages. Lets look at common error patterns when using this library.
```rust,name=compile error                                    ‎,
cargo_build::rerun_if_changed!("main.c", "lib.c");
//                             --------  ^^^^^^^ argument never used
//                             |
//                             formatting specifier missing
```

In this example, `rerun_if_changed!` gives an error because it parses its arguments the same way `println!` macro does - as format string. To fix this error we need to split arguments by `;`.
```rust
cargo_build::rerun_if_changed!("main.c"; "lib.c");
//                                     ^
```

This choise is an attempt to provide better syntax for more complex scenarios where we need to combine variable number of arguments with formatting each one inside one macro call. Variable arguments are split by `;`. Each one of them has the same structure as `format!` macro - list of arguments split by `,`:

```rust
cargo_build::rerun_if_changed!(
    "{}.c", { std::env::var("NAME_MAIN_C").unwrap_or_default() };
    "{}.c", { std::env::var("NAME_LIB_C").unwrap_or_default() }
);
```

Original error source is `format_args!` macro used by every macro which needs formatting in `std` - for example `println!` and `write!`. Lets look at erros produced by those macros.

```rust,name=compile error                                    ‎,
println!("Hello", "World");
//       -------  ^^^^^^^ argument never used
//       |
//       formatting specifier missing
```

This error can happen if beginner sees this macro, remembers there is no varargs in Rust and assumes `println!` takes multiple arguments and prints them one by one.

Compiler can make multiple assumptions:
- User forgot first argument - format string `"{} {}"`.
- User doesn't know how `println!` call usually looks.
- User does know how `println!` call looks, but doesn't know how format specifiers `{}` look.

It is really useful for the last two cases to show an example to the user, so I decided to implement a hint.

### Rust compiler shows an example

As of `rustc-1.92.0-nightly (2025-09-16)` compiler now produces this error. It includes *'help: format specifiers use curly braces, consider adding a format specifier'* message and example:

```shell
error: argument never used
 --> src\main.rs:2:23
  |
2 |     println!("Hello", "World");
  |              -------  ^^^^^^^ argument never used
  |              |
  |              formatting specifier missing
  |
help: format specifiers use curly braces, consider adding a format specifier
  |
2 |     println!("Hello{}", "World");
  |                    ++
```

In addition, if user does know how to use format specifiers `{}` but did use wrong number of them, compiler now suggests a number:

```shell
error: multiple unused formatting arguments
 --> src\main.rs:2:49
  |
2 |     println!("Format: {} {}", "Hello", "World", 1, 2, 3, 4);
  |              ---------------                    ^  ^  ^  ^ argument never used
  |              |                                  |  |  | 
  |              |                                  |  |  argument never used
  |              |                                  |  argument never used
  |              |                                  argument never used
  |              multiple missing formatting specifiers
  |
  = note: consider adding 4 format specifiers
```

Note the last line *'note: consider adding 4 format specifiers'*.

This change affected all formatting macros in `std` because all of them use `format_args!` macro under the hood.

## New errors inside [`cargo-build`](https://github.com/IoaNNUwU/cargo-build)

```shell
error: argument never used
 --> src\main.rs:2:36
  |
2 |     cargo_build::warning!("Hello", "World");
  |                           -------  ^^^^^^^ argument never used      
  |                           |
  |                           formatting specifier missing
  |
help: format specifiers use curly braces, consider adding a format specifier
  |
2 |     cargo_build::warning!("Hello{}", "World");
  |                                 ++
```

`warning!` macro works the same way `println!` does which means this change affected it directly.

Errors in other macro calls did also improve. Compiler shows an example even if macro syntax is different from common ones like `println!` and `format!`. Interestingly enough, I did not need to change code of my crate. Rust compiler is very adaptive and can construct error messages from context even if it doesn't know anything about this context.

```rust,name=compile error                                    ‎,
cargo_build::rustc_link_arg!(
    bin "client": "stack-size=", { 8 * 1024 * 1024 }
);
```

```shell
error: argument never used
 --> src\main.rs:3:38
  |
3 |         bin "client": "stack-size=", { 8 * 1024 * 1024 }
  |                       -------------  ^^^^^^^^^^^^^^^^^^^ argument never used
  |                       |
  |                       formatting specifier missing
  |
help: format specifiers use curly braces, consider adding a format specifier
  |
3 |         bin "client": "stack-size={}", { 8 * 1024 * 1024 }
  |                                   ++
```

The difference between errors in `std` and [`cargo-build`](https://github.com/IoaNNUwU/cargo-build) is that you can easily google errors that happen in `println!` which makes solving them obvious. Beginner Rust tutorials teach how to use format specifiers `{}` in `println!`, but you have to trust docs and compiler errors when using third party crates. Compiler errors in this case are better because:

1. IDEs automatically pick them up (providing `quick-fix` for example).
2. User doesn't need to refer to docs often.

Rust allows you to rely on compiler to catch errors which leads to compiler and type-based patterns such as `Typestate pattern`. This is the reason I think compile errors are such important part of every library.

Before this change, user couldn't figure out `cargo-build` macro syntax without reading docs because using `;` for variable number of arguments in macros is not a common pattern. After this change, punishment for not reading the docs is simply more verbose code because after new compiler suggestiontion user will immediately understand the fact macro parses argument the same way `format!` macro does. Non-optimal, but simple way to solve this - just call macro multiple times. But after reading the docs, user will understand that `;` is used for splitting variable number of arguments inside one macro call.
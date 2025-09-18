+++
title = "Как я улучшил свою библиотеку сделав пулл реквест в Rust компилятор"
description = "Моя библиотека `cargo-build`, используемая как обёртка над `cargo`-инструкциями во время работы билд скрипта `build.rs` страдала от плохих сообщений об ошибках. Мой PR в Rust компилятор улучшил сообщения об ошибках как в стандартной библиотеке Rust (макросы `println!`, `write!`), так и в моей библиотеке. При этом интересно, что код самой библиотеки даже не пришлось менять."
date = 2025-09-17
# updated = 2025-09-17

[taxonomies]
tags = ["build-rs", "cargo-build", "rustc"]
categories = ["rust", "project"]
+++

### Как я улучшил свою библиотеку сделав пулл реквест в Rust компилятор

Моя библиотека [`cargo-build`](https://github.com/IoaNNUwU/cargo-build) - типизированная обёртка над `cargo`-инструкциями во время работы билд скрипта `build.rs`.

Пример её работы:

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

Так как эта библиотека содержит большое количество макросов, я заметил проблему - плохие сообщения об ошибках. Давайте рассмотрим стандартные паттерны применения этих макросов и ошибки, связанные с ними.
```rust,name=compile error                                    ‎,
cargo_build::rerun_if_changed!("main.c", "lib.c");
//                             --------  ^^^^^^^ argument never used
//                             |
//                             formatting specifier missing
```

В этом примере ошибка заключается в том, что макрос `rerun_if_changed!` воспринимает переданные аргументы как строку формата (то есть так же, как `println!`). Правильный вариант - перечислить аргументы через `;`:
```rust
cargo_build::rerun_if_changed!("main.c"; "lib.c");
//                                     ^
```

Такой выбор формата аргумента вызван сильным сокращением синтаксиса в более сложных случаях, которые хотят сочетать переменное количество аргументов с форматированием, всё внутри одного вызова макроса. Множественные аргументы отделяются `;`, при этом каждый из них имеет такую же структуру как макрос `format!`, то есть список аргументов, разделённых запятой:

```rust
cargo_build::rerun_if_changed!(
    "{}.c", { std::env::var("NAME_MAIN_C").unwrap_or_default() };
    "{}.c", { std::env::var("NAME_LIB_C").unwrap_or_default() }
);
```

Но оригинальный источник ошибки - макрос `format_args!`, который используется всеми макросами стандартной библиотеки, которые включают форматирование - например `println!` и `write!`. Давайте рассмотрим ошибки внутри этих макросов.

```rust,name=compile error                                    ‎,
println!("Hello", "World");
//       -------  ^^^^^^^ argument never used
//       |
//       formatting specifier missing
```

Такая ошибка может возникнуть, если новичок увидел макрос, вспомнил что в Rust нет функций с переменным количеством аргументов и предположил, что `println!` принимает несколько аргументов, печатая их по очереди.

Тут можно сделать несколько предположений:
- Пользователь просто забыл первый аргумент - строку форматирования `"{} {}"`.
- Пользователь вообще не знает, как должен выглядеть вызов `println!`
- Пользователь знает, как выглядит вызов `println!`, но не знает, как выглядит указатель формата `{}`.

Для последних двух случаев полезно было бы показать пример, чем я и решил заняться. 

### Rust компилятор теперь показывает пример

В `rustc-1.92.0-nightly (2025-09-16)` компилятор теперь выдаёт следующую ошибку, добавилось сообщение *help: format specifiers use curly braces, consider adding a format specifier* и пример:

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

В дополнение, если пользователь всё же знает, как применять указатели формата `{}`, но при этом указал неверное их количество, компилятор теперь подсказывает, сколько именно не хватает:

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

Заметьте последнюю строчку *note: consider adding 4 format specifiers*, которой раньше не было.

Так как `format_args!` используется внутри всех форматирующих макросов стандартной библиотеки, это изменение затронуло все из них.

### Как же изменились ошибки внутри [`cargo-build`](https://github.com/IoaNNUwU/cargo-build)?

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

Макрос `warning!` работает так же, как и `println!`, поэтому эти изменения напрямую его коснулись.

В остальных макросах изменения так же положительные, компилятор теперь показывает пример даже если синтаксис макроса является несколько необычным и отличается от стандартных `println!` и `format!`. Интересно, что для этого не пришлось никак менять код самой библиотеки. Rust компилятор, как оказалось, очень адаптивный и может собирать сообщения об ошибках из контекста, даже если ничего об этом контексте не знает.

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

Я говорю отдельно о крейте [`cargo-build`](https://github.com/IoaNNUwU/cargo-build), потому что ошибки внутри `println!` достаточно очевидны. Они легко гуглятся и во всех туториалах сразу учат, как именно применять указатели формата `{}` внутри `println!`. Однако в макросе из сторонней библиотеки пользователю остаётся полагаться только на документацию и ошибки компилятора. При этом ошибки компилятора - более хороший интерфейс, потому что он:
1. Автоматически используется внутри IDE (например `quick-fix`).
2. Не требует постоянного чтения документации.

В Rust принято полагаться на компилятор, отсюда и происходят большое количество паттернов, например `Typestate pattern`. Поэтому я считаю сообщения об ошибках компиляции важной частью любой библиотеки.

До этого изменения без прочтения документации `cargo-build`, пользователь не смог бы разобраться в синтаксисе её макросов, ведь применение `;` для множества аргументов - очень редкое явление. После этого изменения, наказание за непрочтение документации - всего лишь больше кода, ведь пользователь сразу поймёт, что макрос воспринимает аргумент как строку формата и способ исправить эту ошибку для него будет очевидным (не совсем оптимальным, но очевидным) - применить макрос несколько раз. Но если пользователь прочитает документацию, то сможет выяснить, что множественные аргументы разделяются `;`.
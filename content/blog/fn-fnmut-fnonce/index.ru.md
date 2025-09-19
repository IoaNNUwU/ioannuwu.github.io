+++
title = "Функциональные трейты :: Fn :: FnMut :: FnOnce"
description = "Трейты `Fn`, `FnMut`, `FnOnce` в Rust."
date = 2025-09-19
# updated = 2025-09-17

[taxonomies]
tags = ["fn", "trait", "thread"]
categories = ["rust", "guide"]
+++

Трейты `Fn`, `FnMut`, `FnOnce` вызывают проблемы у многих пользователей Rust, причём как у новичков, так и у людей с опытом. Давайте же попробуем разобраться в этих трейтах и понять разницу между ними.

### Что такое функция?

```rust
fn add_one(num: i32) -> i32 {  num + 1  }

fn double(num: i32) -> i32 {  num * 2  }

fn main() {
    let current_func_ptr: fn(i32) -> i32 = add_one;
    let func_result = current_func_ptr(10);
    println!("{}", func_result)
}
```

В этом примере используется функциональный указатель. Как и любой другой указатель, он представляет собой число - адрес в оперативной памяти. Разница в том, что он указывает не на какую-либо величину, а на первый байт машинных инструкций функции.

Это можно продемонстрировать так:
```asm,linenos,hl_lines=1-2 6-13,name=машинный код исполняемого файла (упрощённый)              ‎,
lea    eax, [rdi + 1]    ;add_one;
ret
mov    eax, edi          ;double;
imul   eax, edi
ret
...                      ;main;
mov     rax, qword ptr [rip + add_one@GOTPCREL]
...
mov     edi, 10
call    rax
...
call    qword ptr [rip + std::io::stdio::_print@GOTPCREL]
```

<a href="https://godbolt.org/e#g:!((g:!((g:!((h:codeEditor,i:(filename:'1',fontScale:14,fontUsePx:'0',j:1,lang:rust,selection:(endColumn:2,endLineNumber:12,positionColumn:2,positionLineNumber:12,selectionStartColumn:2,selectionStartLineNumber:12,startColumn:2,startLineNumber:12),source:'%23%5Bno_mangle%5D%0Afn+add_one(num:+i32)+-%3E+i32+%7B++num+%2B+1++%7D%0A%0A%23%5Bno_mangle%5D%0Afn+double(num:+i32)+-%3E+i32+%7B++num+*+2++%7D%0A%0A%23%5Bno_mangle%5D%0Afn+main()+%7B%0A++++let+current_func_ptr:+usize+%3D+add_one+as+usize%3B%0A++++let+current_func_ptr:+fn(i32)+-%3E+i32+%3D+unsafe+%7B+std::mem::transmute(current_func_ptr)+%7D%3B%0A++++println!!(%22%7B%7D%22,+current_func_ptr(10))%3B%0A%7D'),l:'5',n:'0',o:'Rust+source+%231',t:'0')),k:41.60548213411649,l:'4',n:'0',o:'',s:0,t:'0'),(g:!((h:compiler,i:(compiler:r1890,filters:(b:'0',binary:'1',binaryObject:'1',commentOnly:'0',debugCalls:'1',demangle:'0',directives:'0',execute:'1',intel:'0',libraryCode:'0',trim:'1',verboseDemangling:'0'),flagsViewOpen:'1',fontScale:14,fontUsePx:'0',j:1,lang:rust,libs:!(),options:'-C+opt-level%3D0',overrides:!(),selection:(endColumn:6,endLineNumber:56,positionColumn:6,positionLineNumber:56,selectionStartColumn:6,selectionStartLineNumber:56,startColumn:6,startLineNumber:56),source:1),l:'5',n:'0',o:'+rustc+1.89.0+(Editor+%231)',t:'0')),k:58.3945178658835,l:'4',n:'0',o:'',s:0,t:'0')),l:'2',n:'0',o:'',t:'0')),version:4" target="_blank">Explore on godbolt.org</a>

Функция `main` загружает адрес функции `add_one` в регистр `rax`, а затем вызывает функцию по адресу из `rax`, после чего печатает результат.

На практике вызываемая функция почти всегда известна во время компиляции, поэтому компилятор оптимизирует машинный код, не используя указатель, тем самым избегая динамического вызова.

### Что такое замыкание?

Замыкание - это в первую очередь **структура**, поэтому о ней нужно рассуждать первостепенно как о структуре. При этом такая структура является анонимной - у неё есть тип, который Rust компилятор присваивает ей автоматически при инициализации, поэтому он не может быть назван явно. После этого поменять тип замыкания, а значит и присвоить его в другую переменную нельзя.

```rust,name=compile error                                    ‎,
let mut one_closure = || {};
let another_closure = || {};

one_closure = another_closure;
// ^ error: no two closures, even if identical, have the same type
```

Так как замыкание является структурой, эта структура может иметь состояние.

Замыкание без состояния является структурой без состояния. Благодаря этому оно может быть преобразовано к функциональному указателю.

```rust
let stateless_closure = || println!("Hello World");
struct StatelessClosure;

let func_pointer: fn() = stateless_closure;
```

Замыкание в большинстве случаев захватывает величины из контекста по ссылке, поэтому аналогом таких замыканий будут являться такие структуры:

```rust
let text = String::new();

let ref_closure = || println!("{}", &text);
struct RefClosure<'a>(&'a String);
```

```rust
let mut text = String::new();

let mut_ref_closure = || text.push('!');
struct MutRefClosure<'a>(&'a mut String);
```

Так как эти замыкания используют ссылки, нам приходится думать о лайфтаймах этих ссылок внутри структур-замыканий, поэтому в примерах я указываю лайфтаймы явно `<'a>`.

Замыкание может владеть своим состоянием, в таком случае оно эквивалентно стандартной структуре с владением. В данном случае замыкание не имеет лайфтайма, ассоциированного с ней:
```rust
let text = String::new();
let owning_closure = move || println!("{}", &text);

let text = String::new();
let owning_closure = || drop(text);

struct OwningClosure(String);
```

### Состояние внутри замыкания

Как видно из примеров, способ захвата зависит от того **как именно** функция распоряжается этим состоянием:

```rust
let text = String::new();

let ref_closure = || println!("{}", &text);
struct RefClosure<'a>(&'a String);

let mut text = String::new();

let mut_ref_closure = || text.push('!');
struct MutRefClosure<'a>(&'a mut String);
```

В этом примере компилятор генерирует два разных замыкания для одинаковых строк. Анонимный тип замыкания (похожий на `RefClosure`/`MutRefClosure`) зависит именно от ого **как** используется захватываемая величина в теле функции. В первом случае используется немутабельная ссылка `&String` - для печати, а во втором мутабельная `&mut String` - для вызова метода `String::push`.

Если же мы используем функции, которые поглощают величину, например `drop`, компилятор генерирует структуру, владеющую своим состоянием. Ключевое слово `move` также изменяет стратегию захвата на владение.

Замыкание владеет состоянием из-за способа использования захватываемой величины:

```rust
let text = String::new();

let owning_closure = || drop(text);
struct OwningClosure(String);
```

Замыкание владеет состоянием из-за использования ключевого слова `move`:

```rust
let text = String::new();

let owning_closure = move || println!("{}", &text);
struct OwningClosure(String);

let text = String::new();

let owning_closure = move || text.push('!');
struct OwningClosure(String);
```

### Трейты `Fn`, `FnMut`, `FnOnce`

Отдельно от состояния замыкания, существуют 3 трейта, которые используются для описания замыканий и присваиваются компилятором автоматически во время присвоения анонимного типа замыканию.

Одна из причин их появления - тот факт, что тип замыкания невозможно назвать, ведь анонимному типу замыкания даёт название компилятор:

```rust,name=compile error                                    ‎,
let text = String::from("Hello World");
let closure = || println!("{}", &text);

fn call_me(closure: type??) {
    closure();
}
```

Давайте сначала рассмотрим как эти трейты выглядят и как их описывает документация:

* Instances of `FnOnce` can be called, but **might not be called multiple times**

```rust
pub trait FnOnce<Args> {
    type Output;
    fn call_once(self, args: Args) -> Self::Output;
}
```

* Instances of `FnMut` can be called repeatedly and **may mutate state**

```rust
pub trait FnMut<Args>: FnOnce {
    fn call_mut(&mut self, args: Args) -> Self::Output;
}
```

* Instances of `Fn` can be called repeatedly **without mutating state**

```rust
pub trait Fn<Args>: FnMut {
    fn call(&self, args: Args) -> Self::Output;
}
```

> Здесь стоит заметить что эти трейты зависят друг от друга. `FnOnce` является супертрейтом для `FnMut`, который в свою очередь является супертрейтом для `Fn`.

### Как компилятор присваивает трейты

Давайте рассмотрим, какие трейты компилятор присваивает в рассмотренных ранее примерах:

```rust
let stateless_closure = || println!("Hello World");
struct StatelessClosure;

let func_pointer: fn() = stateless_closure;
```







### Skibidi

Давайте рассмотрим как эти трейты выглядят и постараемся понять, в чём разница между ними:

Здесь можно сделать несколько замечаний:

#### Трейты зависят друг от друга `Fn`: `FnMut`: `FnOnce`.

Это означает, что если замыкание реализует `Fn`, то оно обязано реализовывать также трейты `FnMut` и `FnOnce`.

Это может показаться контринтуитивным, потому что `Fn` накладывает меньше всего ограничений на применение аргумента.

Давайте попробуем посмотреть на это с точки зрения определения трейтов. `FnOnce` поглощает `self` при вызове своего метода `call_once(self, args: Args)`. Это значит, что вызвать замыкание типа `FnOnce` невозможно через ссылку, только через переменную которая владеет замыканием:

```rust,name=compile error                                    ‎,
let text = String::from("Hello World");
let fn_once_owning_closure = || drop(text);

let fn_once_ref = &fn_once_owning_closure;
fn_once_ref();
// ^ cannot move out of `*fn_once_ref` which is behind a shared reference

let fn_once_ref_mut = &mut fn_once_owning_closure;
fn_once_ref_mut();
// ^ cannot move out of `*fn_once_ref_mut` which is behind a mutable reference

fn_once_owning_closure(); // This is the only way to call `FnOnce` closure
```

Но владение в Rust работает очень интересным образом.  


### Тип замыкания не всегда связан с состоянием, которое оно захватывает


### Выбор правильного трейта


Я часто вижу советы о том, какой трейт выбрать и тд..

На самом деле это полная глупость. Выбирать ничего не нужно ни с одной, ни с другой стороны.

Автор библиотеки `FnOnce` -> `FnMut` -> `Fn` (почти никогда) ?? `fn` для простоты.

Пользователь просто пишет код и ждёт какой трейт присвоит компилятор. Если компилятор присваивает не тот трейт, который вам нужно для библиотечной функции, стоит подумать, почему так?

Может быть библиотека вызывает вашу функцию в цикле, но вызов вашей функции поглотит состояние (вызываете ли вы функции похожие на `drop`, которые поглощают состояние, используемое вами).

А может быть автор библиотеки сам сделал ошибку и сделал барьер слишком высоким - например он просит `Fn` там где можно просить `FnMut` (я напомню `Fn` - это изотерика и очень сложно найти реальное применение).

### TL:DR

Замыкание - это в первую очередь **структура**. У неё существует 2 характеристики - характер состояния, которое оно захватывает и функциональный трейт, которое оно реализует.

Характер состояния зависит от того, **как** используется та или иная величина внутри замыкания и существует независимо от функционального трейта. Ключевое слово `move` изменяет стратегию захвата на владение, независимо от того, **как** используется величина внутри замыкания.

Функциональный трейт, реализуемый замыканием, зависит от того, как замыкание распоряжается захваченным состоянием при вызове. Если замыкание поглощает величину, то при повторном вызове ей неоткуда взяться, а значит компилятор присвоит `FnOnce`. Если замыкание изменяет величину, тогда ей будет присвоен `FnMut`, иначе `Fn`.

Замыкания типа `Fn` могут быть переданы в функции, требующие `FnOnce` или `FnMut` как аргумент. Это происходит из-за зависимости трейтов друг от друга.

`Fn`: `FnOnce`: `FnMut`.

На практике пользователь библиотеки должен думать о трейте, который компилятор присваивает вашему замыканию, только если возникают ошибки компиляции - нужно понять почему именно ваша функция не подходит в качестве аргумента. Самая частая ошибка со стороны пользователя - ваше `FnOnce` замыкание поглощает состояние при вызове (используется функция/метод, которое поглощает величину, например `drop`), тогда как библиотека требует `FnMut`, потому что ваша функция будет вызвана в цикле - например метод `map` для каждого элемента итератора. 

Самая частая ошибка со стороны автора библиотеки - слишком сильное ограничение трейта. Сначала нужно попробовать применить `FnOnce`, это возволит пользователю передавать вообще любые замыкания как аргумент. Но это невозможно если пользовательская функция вызывается в цикле - в таком случае нужно применять `FnMut`. `Fn` **не нужно** применять, за редким исключением, чаще всего касающимся многопоточности.


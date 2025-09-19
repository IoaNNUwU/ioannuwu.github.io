fn main() {
let text = String::from("Hello World");
let mut fn_once_owning_closure = || drop(text);

let fn_once_ref_mut = &mut fn_once_owning_closure;
fn_once_ref_mut();
}

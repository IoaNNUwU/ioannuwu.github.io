+++
title = "Shortcodes"
date = 2025-06-07
+++

This theme includes some useful custom shortcodes that you can use to enhance
your posts. Whether you want to display a gallery of images, or format a
professional-looking reference section, these custom shortcodes have got you
covered.

<!-- more -->

## Alert Shortcode

Bring attention to information with these GitHub-style alert shortcodes. They
come in five `type`s: `note`, `tip`, `info`, `warning`, and `danger`.

{{ alert(type="note", text="Some **content** with _Markdown_ `syntax`. Here is [a `link`](#alert-shortcode).") }}
{{ alert(type="tip", text="Some **content** with _Markdown_ `syntax`. Here is [a `link`](#alert-shortcode).") }}
{{ alert(type="info", text="Some **content** with _Markdown_ `syntax`. Here is [a `link`](#alert-shortcode).") }}
{{ alert(type="warning", text="Some **content** with _Markdown_ `syntax`. Here is [a `link`](#alert-shortcode).") }}
{{ alert(type="danger", text="Some **content** with _Markdown_ `syntax`. Here is [a `link`](#alert-shortcode).") }}

You can change the `title` and `icon` of the alert. Both parameters take a
string and default to the type of alert. `icon` can be any of the available
alert types.

{{ alert(type="note", title="Custom title and icon", icon="tip", text="Some **content** with _Markdown_ `syntax`. Here is [a `link`](#alert-shortcode).") }}

### Usage

You can use alerts in two ways:

1. Inline with parameters:

   ```jinja
   {{/* alert(type="danger", icon="tip", title="An important tip", text="Stay hydrated~") */}}
   ```

2. With a content body:

   ```jinja
   {%/* alert(type="danger", icon="tip", title="An important tip") */%}
   Stay hydrated~

   This method is particularly useful for longer content or multiple paragraphs.
   {%/* end */%}
   ```

Both methods support the same parameters (`type`, `icon`, and `title`), with the
content either passed as the `text` parameter or as the body between tags.

{% alert(type="note") %}
Zola will add GitHub-flavored Markdown alerts in a later release, such as:

```markdown
[!NOTE]
This is a note.
```

See [getzola/zola#2817](https://github.com/getzola/zola/issues/2817) for
details. When this feature is available upstream, the `alert` shortcode will be
deprecated. {% end %}

## Mastodon Shortcode

Embed a Mastodon post into your content using the `mastodon` shortcode.

{{ mastodon(url="https://hachyderm.io/@ebkalderon/114462281016082381") }}

### Usage

```jinja
{{/* mastodon(url="https://hachyderm.io/@ebkalderon/114462281016082381") */}}
```

## References

This shortcode formats a reference section with a hanging indent like so:

{% references() %}

Alderson, E. (2015). Cybersecurity and Social Justice: A Critique of Corporate
Hegemony in a Digital World. *New York Journal of Technology, 11*(2), 24-39.
[https://doi.org/10.1007/s10198-022-01497-6](https://doi.org/10.1007/s10198-022-01497-6).

Funkhouser, M. (2012). The Social Norms of Indecency: An Analysis of Deviant
Behavior in Contemporary Society. *Los Angeles Journal of Sociology, 16*(3),
41-58. [https://doi.org/10.1093/jmp/jhx037](https://doi.org/10.1093/jmp/jhx037).

Schrute, D. (2005). The Beet Farming Revolution: An Analysis of Agricultural
Innovation. *Scranton Agricultural Quarterly, 38*(3), 67-81.

Steinbrenner, G. (1997). The Cost-Benefit Analysis of George Costanza: An
Examination of Risk-Taking Behavior in the Workplace. *New York Journal of
Business, 12*(4), 112-125.

Winger, J. A. (2010). The Art of Debate: An Examination of Rhetoric in Greendale
Community College's Model United Nations. *Colorado Journal of Communication
Studies, 19*(2), 73-86.
[https://doi.org/10.1093/6seaons/1movie](https://doi.org/10.1093/6seaons/1movie).

{% end %}

### Usage

```jinja
{%/* references() */%}

Your references go here.

Each in a new line. Markdown (links, italics...) will be rendered.

{%/* end */%}
```

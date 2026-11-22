---
layout: single
title: "Sitemap"
permalink: /sitemap/
---
An [XML version]({{ '/sitemap.xml' | relative_url }}) is available for search engines.

## Pages

{% for link in site.data.navigation.main %}- [{{ link.title }}]({{ link.url | relative_url }})
{% endfor %}

## Projects and activities

{% for post in site.posts %}- [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}{% for item in site.portfolio %}- [{{ item.title }}]({{ item.url | relative_url }})
{% endfor %}{% for t in site.talks %}- [{{ t.title }}]({{ t.url | relative_url }})
{% endfor %}

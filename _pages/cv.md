---
layout: single
title: "Curriculum vitae"
permalink: /cv/
redirect_from:
  - /resume
---

## Current position

Assistant Professor, Department of Computer Science & Information Systems, [BITS Pilani, K K Birla Goa Campus](https://www.bits-pilani.ac.in/goa/anirban-das/), since August 2025.

## Education

- **Ph.D. in Computer Science and Engineering**, Indian Institute of Information Technology Guwahati, 2022. Supervisor: [Dr. Suchetana Chakraborty](https://sites.google.com/site/suchetana0116)
- **M.Tech. in Information Technology**, 2013
- **B.E. in Computer Science and Engineering**, 2010

## Research experience

- **Post-Doctoral Fellow**, [Ubiquitous Networked Systems Lab](https://cse.iitkgp.ac.in/resgrp/ubinet/), IIT Kharagpur, Feb 2022 – Apr 2023. Supervisor: [Dr. Sandip Chakraborty](http://cse.iitkgp.ac.in/~sandipc/)
- **Project Trainee**, Indian Statistical Institute, Kolkata, Jun 2012 – Jul 2013. Supervisor: [Dr. Ujjwal Bhattacharya](https://www.isical.ac.in/~ujjwal/)

## Teaching experience

{% assign entries = site.teaching | sort: "date" | reverse %}
<ol class="tl tl--compact">
  {% for t in entries %}{% include teaching-entry.html entry=t %}{% endfor %}
</ol>

## Grants

- [AI-based On-road Context Assessment](/posts/2025/10/ai-onroad-context/), BITS Pilani New Faculty Seed Grant, ₹20,00,000, 2025

## Service

- Web Chair, [IEEE PerCom 2027](https://percom.org/organizing-committee/), Goa, India

## Publications

{% assign groups = "journal:Journal articles,conference:Conference papers,demo:Demos,preprint:Preprints,patent:Patents" | split: "," %}
{% for g in groups %}{% assign kv = g | split: ":" %}
<h3 class="cv-sub">{{ kv[1] }}</h3>
<ol class="pubs pubs--compact">
  {% for p in site.data.publications %}{% if p.type == kv[0] %}{% include pub.html pub=p compact=true %}{% endif %}{% endfor %}
</ol>
{% endfor %}

## Talks and demos

{% for t in site.talks %}- {{ t.title }}, {{ t.venue }}, {{ t.location }}, {{ t.date | date: "%B %Y" }}
{% endfor %}

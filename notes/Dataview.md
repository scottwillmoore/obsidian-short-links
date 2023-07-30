#dataview 

# Data

[[Australia]]
[[Australia#Victoria]]
[[Australia#^states-and-territories]]

[[Australia|AUS]]
[[Australia#Victoria|VIC]]
[[Australia#^states-and-territories|States and Territories]]

[[Australia|<]]
[[Australia#Victoria|<<]]
[[Australia#^states-and-territories|<<<]]

# View

```dataview
TABLE file.outlinks FROM #dataview
```

```dataview
TABLE WITHOUT ID file.link, "[[" + replace(file.path, ".md", "") + "]]" WHERE file = this.file
```

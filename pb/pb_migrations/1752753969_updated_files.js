/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_files")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file6666666666",
    "maxSelect": 1,
    "maxSize": 9007199254740991,
    "mimeTypes": [],
    "name": "file",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_files")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file6666666666",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "file",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})

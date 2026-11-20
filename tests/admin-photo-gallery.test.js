const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {moveImages} = require('../js/admin-photo-gallery.js');

const photos = ['front.png','side.png','back.png'];
assert.deepEqual(moveImages(photos,0,2,true),
  {images:['side.png','back.png','front.png'],newIndex:2,changed:true});
assert.deepEqual(moveImages(photos,2,0,false),
  {images:['back.png','front.png','side.png'],newIndex:0,changed:true});
assert.deepEqual(moveImages(photos,0,1,true),
  {images:['side.png','front.png','back.png'],newIndex:1,changed:true});
assert.deepEqual(moveImages(photos,1,1,false).changed,false);
assert.equal(moveImages(photos,1,-1,false).changed,false);
assert.deepEqual(photos,['front.png','side.png','back.png']); // input not mutated

const base=path.resolve(__dirname,'..');
const admin=fs.readFileSync(path.join(base,'js/admin.js'),'utf8');
const html=fs.readFileSync(path.join(base,'admin.html'),'utf8');
assert.match(admin,/renderPhotoEditor\(p,draft.images\)/);
assert.doesNotMatch(admin,/data-edit-photos|data-photo-move/);
assert.match(admin,/admin-photo-add-tile/);
assert.match(admin,/data-photo-remove/);
assert.match(admin,/AstelPhotoGallery/);
assert.match(html,/css\/admin-photos\.css/);
assert.ok(html.indexOf('js/admin-photo-gallery.js') < html.indexOf('js/admin.js'));
console.log('PASS: inventory photos always visible; drag ordering, main image and gallery assets are wired');

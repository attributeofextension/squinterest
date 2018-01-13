
function loaded(event) {
//initialize masonry.js
$('.grid').masonry({
  // options
  itemSelector: '.grid-item',
  columnWidth: '.grid-sizer',
  percentPosition : true
});

function defaultImage(event) {
  event.target.src = "/assets/senor-chang-paper.jpg";
}
var images = document.getElementsByTagName("img");
for(var i = 0; i < images.length; i++ ) {
  images[i].addEventListener("error",defaultImage);
}


}



$("document").ready(loaded);
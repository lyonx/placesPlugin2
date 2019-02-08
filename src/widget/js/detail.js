import Buildfire, { components } from 'buildfire';
import Handlebars from './lib/handlebars';
import bookmarks from "./lib/bookmarkHandler";


window.detailView = {
    init: (place) => {
        //Add filter control
        let view = document.getElementById('detailView');
        let screenWidth = window.innerWidth;
        const title = place.title;

        let context = {
            width: screenWidth,
            image: place.image,
            title: title,
            description: place.description,
            distance: place.distance,
            address: place.address.name,
            actionItems: place.actionItems && place.actionItems.length > 0,
            lat: place.address.lat,
            lng: place.address.lng
        };

        let req = new XMLHttpRequest();
        req.open('GET', './templates/detail.hbs');
        req.send();
        req.onload = () => {
            let theTemplate = Handlebars.compile(req.responseText);

            // Pass our data to the template
            let theCompiledHtml = theTemplate(context);

            // Add the compiled html to the page
            view.innerHTML = theCompiledHtml;

            //TODO: Move to common location
            let mapTypeId = window.google.maps.MapTypeId.ROADMAP,
                zoomTo = 14, //city
                centerOn = {lat: place.address.lat, lng: place.address.lng};

            let options = {
                gestureHandling: 'greedy',
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoom: zoomTo,
                center: centerOn,
                mapTypeId: mapTypeId,
                disableDefaultUI: true
            };

            const index = app.state.places.findIndex(statePlace => statePlace.id === place.id);
            
            let bookmark = document.getElementById('detailViewBookmark');
            place.bookmarked ? bookmark.className = 'bookmark glyphicon-star' : bookmark.className = 'bookmark glyphicon-star-empty';
            
            let listViewBookmark = document.getElementById('listView_bookmark_' + place.id);
            
            bookmark.addEventListener('click', (e) => {
                e.stopPropagation();
                const callback = () => {
                    window.app.state.places[index].bookmarked ? bookmark.className = 'bookmark glyphicon-star' : bookmark.className = 'bookmark glyphicon-star-empty';
                    let marker = window.app.state.markers.filter(marker => marker.id === place.id)[0];
                    window.mapView.markerClick(app.state.places[index], marker);
                    window.app.state.places[index].bookmarked ? listViewBookmark.className = 'bookmark glyphicon-star' : listViewBookmark.className = 'bookmark glyphicon-star-empty';
                    
                }
                place.bookmarked ? bookmarks.delete(app.state, place, index, callback) : bookmarks.add(app.state, place, index, callback);

            });

            /**
             * Get Directions
             */
             let directionsButton = document.getElementById('directionsBtn');
             directionsButton.className = 'btn btn-primary';
             directionsButton.addEventListener('click', getDirections);

             let contactButton = document.getElementById('contactBtn');
             if (contactButton) {
                contactButton.className = 'btn btn-success';
                contactButton.addEventListener('click', showContact);
             }

             function getDirections() {
                let hbsContext = context;
                Buildfire.getContext((err, context) => {
                    if (context && context.device && context.device.platform === 'ios') {
                        Buildfire.navigation.openWindow(`https://maps.apple.com/?q=${hbsContext.title}&t=m&daddr=${hbsContext.lat},${hbsContext.lng}`, '_system');
                    } else {
                        Buildfire.navigation.openWindow(`http://maps.google.com/maps?daddr=${hbsContext.lat},${hbsContext.lng}`, '_system');
                    }
                });
             }

             function showContact() {
                const { actionItems } = place;
                window.buildfire.actionItems.list(actionItems, {}, (err, actionItem) => {
                    if (err) return console.error(err);
                    console.log(actionItem);
                });
             }

            /**
             * Carousel
             */
            if (place.carousel && place.carousel.length) {
                let targetNode = document.getElementById('carouselView');
                // Set carousel's height to a 16:9 aspect ratio
                targetNode.style.height = `${window.innerWidth / 16 * 9}px`;
                new components.carousel.view({
                    selector: targetNode,
                    items: place.carousel
                });
            }

            /**
             * Google Maps
             */

            let map = new window.google.maps.Map(document.getElementById('smallMap'), options);

            const iconBaseUrl = 'https://app.buildfire.com/app/media/',
                icon = {
                    url: iconBaseUrl + 'google_marker_green_icon.png',
                    // This marker is 20 pixels wide by 20 pixels high.
                    scaledSize: new window.google.maps.Size(20, 20),
                    // The origin for this image is (0, 0).
                    origin: new window.google.maps.Point(0, 0),
                    // The anchor for this image is at the center of the circle
                    anchor: new window.google.maps.Point(10, 10)
                };

            new window.google.maps.Marker({
                position: place.address,
                map,
                icon
            });
        };
    },

};

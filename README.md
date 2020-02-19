TissUUmaps
==========

![TissUUmaps banner](https://github.com/wahlby-lab/TissUUmaps/blob/master/misc/design/logo-github-2443-473.png)

TissUUmaps is a lightweight viewer that uses basic web tools to visualize gene expression data or any kind of point data on top of whole slide images.

You can easily use it locally, or remotely creating a server.

TissUUmaps tries to keep it minimal so the setup doesn't become complicated. You can use more advanced libraries if you want but we try to make it simple, just HTML, JavaScript and CSS

## How to start

Since we don't want to use external servers to serve our images, let's convert them to an open pyramidal format where we can see individual tiles and OpenSeadragon can easily load the correct tile for you, the user's view. It is called Deep Zoom Image. OpenSeadragon can import other formats, for more information go here [Supported Tile Sources](https://openseadragon.github.io/)

![TissUUmaps workflow](https://github.com/wahlby-lab/TissUUmaps/blob/master/misc/design/banner2.png)

This image sumarizes the process of converting a whole slide image into a DZI. As long as [OpenSlide](https://openslide.org/) can open the format, then the program [VIPS](https://libvips.github.io/libvips/) will be able to convert it to a DZI.

[VIPS](https://libvips.github.io/libvips/) is a super powerful image processing library. It offers a specific command to convert an image to DZI. For example:

`vips dzsave slide.ndpi  --tile-size=254 --overlap=1 --depth onetile --suffix .jpg[Q=90] mySlide`

**Info:**
More on VIPS dzsave [here](https://libvips.github.io/libvips/API/current/Making-image-pyramids.md.html)
How does DZI work? Interesting blog post [here](https://www.gasi.ch/blog/inside-deep-zoom-1)

## Enter TissUUmaps

Once you have your tiled DZ image in the computer where you will use TissUUmaps, you can clone **this repository**.
In the HTML file [example.html](https://github.com/wahlby-lab/TissUUmaps/blob/master/example.html) you just need to tell TissUUmaps where your image is. To do this, check the last script tag in the HTML and change the value of `tmapp.fixed_file`

```HTML
<script>

    document.getElementById("project_title").innerText = "Project title";
    $(document).ready(function () {
        tmapp.fixed_file = "path/to/mySlide.dzi";
        tmapp.registerActions();
        tmapp.init();
    });
</script>
```
## All set!

Once you have your pyramidal image and your HTML set then you can open it in any browser and see TissUUmaps displaying your slide. You can use the right panel to load data point and explore them.

## Example




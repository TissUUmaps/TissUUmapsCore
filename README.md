TissUUmaps - UU is for Uppsala University ;) 
==========

![TissUUmaps banner](https://github.com/TissUUmaps/TissUUmapsCore/blob/master/misc/design/logo-github-2443-473.png)

TissUUmaps is a lightweight viewer that uses basic web tools to visualize gene expression data or any kind of point data on top of whole slide images.

You can easily use it locally, or remotely creating a server.

TissUUmaps tries to keep it minimal so the setup doesn't become complicated. You can use more advanced libraries if you want but we try to make it simple, just HTML, JavaScript and CSS.

Images are display with OpenSeadragon, point data is displayed by D3, and everything else is done by TissUUmaps.

## How to start

Since we don't want to use external servers to serve our images, let's convert them to an open pyramidal format where we can see individual tiles and OpenSeadragon can easily load the correct tile for you. It is called Deep Zoom Image. OpenSeadragon can import other formats, for more information go here [Supported Tile Sources](https://openseadragon.github.io/)

![TissUUmaps workflow](https://github.com/TissUUmaps/TissUUmapsCore/blob/master/misc/design/banner2.png)

This image sumarizes the process of converting a whole slide image into a DZI. As long as [OpenSlide](https://openslide.org/) can open the format, then the program [VIPS](https://libvips.github.io/libvips/) will be able to convert it to a DZI.

[VIPS](https://libvips.github.io/libvips/) is a super powerful image processing library. It offers a specific command to convert an image to DZI. For example:

`vips dzsave slide.ndpi  --tile-size=254 --overlap=1 --depth onepixel --suffix .jpg[Q=90] mySlide`

**Info:**
More on VIPS dzsave [here](https://libvips.github.io/libvips/API/current/Making-image-pyramids.md.html)
How does DZI work? Interesting blog post [here](https://www.gasi.ch/blog/inside-deep-zoom-1)

## Enter TissUUmaps

Once you have your tiled DZ image in the computer where you will use TissUUmaps, you can clone **this repository**.
In the HTML file [index.html](https://github.com/TissUUmaps/TissUUmapsCore/blob/master/index.html) you just need to tell TissUUmaps where your image is. To do this, check the last script tag in the HTML and change the value of `tmapp.fixed_file`

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

## Your own local web!

For safety reasons, your browser and your computer need to know where data comes from. For this purpose, you need to set up your own local web server. There are many different choices. We can recommend for example, the web server addon from Chrome, or if you have Apache you can use it, or node.js. More info on how to allow your browser to use local files in our TissUUmaps website [https://tissuumaps.research.it.uu.se/howto.html#section-setup](https://tissuumaps.research.it.uu.se/howto.html#section-setup) and in the videos below.

## All set!

Once you have your pyramidal image and your HTML set then you can open it in any browser and see TissUUmaps displaying your slide. You can use the right panel to load point data and explore.

## Example

We have designed an example for setting up your own TissUUmaps. The videos also comment on the general aspects of the design of TissUUmaps.

<table>
    <tr>
        <td width="50%">
            <a href="https://tissuumaps.research.it.uu.se/howto.html#section-whatis">
            <img src="https://tissuumaps.research.it.uu.se/media/images/posters/DataInTissUUmaps.png" />
            </a>
        </td>        
        <td width="50%">
             <a href="https://tissuumaps.research.it.uu.se/howto.html#section-setup">
            <img src="https://tissuumaps.research.it.uu.se/media/images/posters/SetupTM-BCS.png" />
            </a>
        </td>
    </tr>
</table>

## How to use TissUUmaps

Here you can find several videos explaining how to use TissUUmaps

<table>
    <tr>
        <td>
             <a href="https://tissuumaps.research.it.uu.se/howto.html#section-using">
            <img src="https://tissuumaps.research.it.uu.se/media/images/posters/ViewingGeneExpressionData.png">
           </a>
        </td>        
        <td>
             <a href="https://tissuumaps.research.it.uu.se/howto.html#section-using">
            <img src="https://tissuumaps.research.it.uu.se/media/images/posters/UsingRegionsExploreData.png">
           </a>
        </td>
    </tr>
     <tr>
        <td>
           <a href="https://tissuumaps.research.it.uu.se/howto.html#section-setup">
            <img src="https://tissuumaps.research.it.uu.se/media/images/posters/SetupTM-BCS.png">
           </a>
        </td>        
        <td width="50%">
        </td>
    </tr>
    
</table>


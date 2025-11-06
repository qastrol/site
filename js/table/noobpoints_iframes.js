// Optional mapping of redeem codes to iframe embed HTML for noobpoints previews.
// Place this file as-is and edit the entries to match redeem codes.
// Example keys should be normalized (lowercase, alphanumerics) but the code matches by the
// normalized filename as well as the raw code.

window.noobpointsIframes = {
    // Example Twitch clip embed (replace parent with your domain when deploying)
    "exampleclip": `<iframe src="https://clips.twitch.tv/embed?clip=EndearingWildMinkTTours-hYNiXvjvu_eYrhYk&parent=www.example.com" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>`,

    // Example YouTube embed
    "exampleyt": `<iframe width="560" height="315" src="https://www.youtube.com/embed/iVvRVTT5Enc?si=xVfpebzlMnnhLiAK" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
};

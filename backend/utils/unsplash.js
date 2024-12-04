const { createApi } = require("unsplash-js");

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
});

async function getUnsplashImage(keyword) {
  try {
    const result = await unsplash.search.getPhotos({
      query: keyword,
      perPage: 1,
    });

    if (result.response && result.response.results.length > 0) {
      return result.response.results[0].urls.regular;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    throw new Error("Error fetching Unsplash image");
  }
}

module.exports = getUnsplashImage;

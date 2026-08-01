const withPlugins = require('next-compose-plugins')

module.exports = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "res.cloudinary.com"],
  },
}

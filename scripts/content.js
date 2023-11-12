require('dotenv').config()

const API_KEY = process.env.API_KEY
const PLAYLIST_ID = new URLSearchParams(window.location.search).get('list')

let stats
async function getAllPlaylistItems() {

    let allItems = []
    let nextPageToken = ''

    do {

        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&pageToken=${nextPageToken}&playlistId=${PLAYLIST_ID}&key=${API_KEY}`

        const response = await fetch(url)

        if (!response.ok) throw new Error()

        const data = await response.json()

        allItems = allItems.concat(data.items)

        nextPageToken = data.nextPageToken

    } while (nextPageToken)

    stats = document.querySelector('.metadata-stats')
    stats.insertAdjacentHTML('afterbegin', '<span id="pcext-wait-text">calculating...</span>')

    return allItems

}

async function getDataFromVideos(videosId) {

    let allVideos = []
    for (let videoId of videosId) {
        const url = `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${API_KEY}`

        const response = await fetch(url)

        if (!response.ok) throw new Error()

        const data = await response.json()

        allVideos = allVideos.concat(data.items)
    }

    return allVideos

}

getAllPlaylistItems()
    .then(items => {

        let allVideosId = []

        for (let item of items) {
            allVideosId = allVideosId.concat(item.contentDetails.videoId)
        }

        return getDataFromVideos(allVideosId)
    })
    .then(videos => {

        let totalDuration = 0

        for (let video of videos) {
            const duration = video.contentDetails.duration

            totalDuration = totalDuration + convertISO8601ToSeconds(duration)

        }

        console.log("Total:", totalDuration)
        attachTotalDuration(totalDuration)
    })
    .catch(error => {
        console.error(error)
    })


function attachTotalDuration(total) {

    let finalDurattion = ''
    if (total < 60) {

        finalDurattion = `${total} seconds`

    } else if (total >= 60 && total < 3600) {

        let totalMinutes = Math.ceil(total / 60)
        finalDurattion = `${totalMinutes} minutes`

    } else {

        let totalHours = Math.ceil(total / 3600)
        finalDurattion = `${totalHours} hours`
    }

    document.querySelector('#pcext-wait-text').remove()
    stats.insertAdjacentHTML('afterbegin', `<span id="pcext-total-duration">${finalDurattion} • </span>`)

}

function convertISO8601ToSeconds(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    const seconds = parseInt(match[3]) || 0

    const totalSeconds = hours * 3600 + minutes * 60 + seconds

    return totalSeconds
}
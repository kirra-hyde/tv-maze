import axios from "axios";
import jQuery from 'jquery';

const $ = jQuery;

const $showsList = $("#showsList");
const $showsButton = $(".Show-getEpisodes")
const $episodesArea = $("#episodesArea");
const $episodesList = $("#episodesList");
const $searchForm = $("#searchForm");

const BASE_URL = "https://api.tvmaze.com/";
const MISSING_URL = "https://tinyurl.com/tv-missing";

interface ShowInterface {
  id: number,
  name: string,
  summary: string,
  image: string,
}

interface ShowResultInterface {
  show: {
    id: number,
    name: string,
    summary: string,
    image: { medium: string; } | null,
  };
}

interface EpisodeInterface {
  id: number,
  name: string,
  season: number,
  number: number,
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

//https://api.tvmaze.com/search/shows?q=girls
async function searchShowsByTerm(term: string): Promise<ShowInterface[]> {
  const response = await axios.get(`${BASE_URL}search/shows/?q=${term}`);

  const result: ShowResultInterface[] = response.data;
  return result.map(result => {
    const s = result.show;
    return {
      id: s.id,
      name: s.name,
      summary: s.summary,
      image: s.image?.medium || MISSING_URL,
    };
  });
}


/** Given list of shows, create markup for each and to DOM */

function populateShows(shows: ShowInterface[]): void {
  $showsList.empty();

  for (const show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src=${show.image}
              alt=${show.name}
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay(): Promise<void> {
  const term = $("#searchForm-term").val() as string;
  const shows = await searchShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt: JQuery.SubmitEvent) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});


/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: number): Promise<EpisodeInterface[]> {
  const response = await axios.get(`${BASE_URL}episodes/${id}`);

  const result: EpisodeInterface[] = response.data;
  return result.map(e => ({
      id: e.id,
      name: e.name,
      season: e.season,
      number: e.number,
  }));
}

/** Given list of episodes, create markup for each and to DOM */

function populateEpisodes(episodes: EpisodeInterface[]): void {
  $episodesList.empty();

  for (const episode of episodes) {
    const $listItem = $(
      `<li>
        ${episode.name}
        Season: ${episode.season}
        Ep #${episode.number}
      </li>`
      );

    $episodesList.append($listItem);
  }
  $episodesArea.show();
 }

/** Click handler for getEpisodes button; grabs show ID, retrieves and displays
 *  episodes
 */

 async function getAndDisplayEpisodes(evt: JQuery.ClickEvent) : Promise<void> {
  const showId = Number(evt.target().closest(".Show").attr("data-show-id"));

  const episodes = await getEpisodesOfShow(showId);
  populateEpisodes(episodes);
 }

 $showsButton.on("click", getAndDisplayEpisodes);

const roundWaitingTime = 3000;
let alreadyClicked = false;
let highScore = localStorage.getItem('high-score') || 0;
let score = 0;

function generateRandomArticle() {
  return new Promise(async (next, reject) => {
  	try {
  	  const call = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=random&format=json&origin=*&rnnamespace=0&prop=images&rnlimit=1');
  	  const response = await call.json();
  	  const result = response.query.random;
  	  next(result[0]);
  	} catch(error) {
  	  reject(error);
  	}
  });
}

function generateTwoRandomArticles() {
  return new Promise(async (next, reject) => {
  	try {
  	  const articles = [];

  	  while(articles.length !== 2) {
  	  	const article = await generateRandomArticle();
  	  	article.image = await getImageOfArticle(article.title);

  	  	if(article.image) {
  	  	  article.views = await getViewsOfArticle(article.title);
  	  	  articles.push(article);

          if(articles.length === 1) {
            setMainPageBackground(article.image);
          }
  	  	}
  	  }

  	  next(articles);
    } catch(error) {
      reject(error);
    }
  });
}

function getViewsOfArticle(title) {
  return new Promise(async (next, reject) => {
  	const todayDate = new Date();
  	const aMonthAgoDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, todayDate.getDate());
  	const todayDateFormated = formateDate(todayDate);
  	const aMonthAgoDateFormated = formateDate(aMonthAgoDate);

  	try {
  	  const call = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${title}/daily/${aMonthAgoDateFormated}/${todayDateFormated}`);
  	  const response = await call.json();
  	  let totalViews = 0;

      if(!response.items.length)
        return next(0);

  	  response.items.forEach(item => {
  	  	totalViews += item.views;
  	  });

  	  next(totalViews);
  	} catch(error) {
  	  reject(error);
  	}
  });
}

function getImageOfArticle(title) {
  return new Promise(async (next, reject) => {
  	try {
  	  const call = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&origin=*&titles=${title}&pithumbsize=1280`);
  	  const response = await call.json();
  	  const pageId = Object.getOwnPropertyNames(response.query.pages)[0];
  	  const pageThumbnail = response.query.pages[pageId].thumbnail;
  	  
  	  if(!pageThumbnail)
  	  	next(null);

  	  next(pageThumbnail.source);
  	} catch(error) {
  	  reject(error);
  	}
  });
}

function formateDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().length === 1 ? `0${date.getMonth()}` : date.getMonth();
  const day = date.getDate().toString().length === 1 ? `0${date.getDate()}` : date.getDate();
  return `${year}${month}${day}`;
}

async function newRound() {
  try {
  	setLoading();
  	const articles = await generateTwoRandomArticles();
  	clearViews();
  	setArticleElements(articles);
    alreadyClicked = false;
  	setVS();
  } catch(error) {
    setError();
    console.log(error);
  }
}

function setLoading() {
  const vsElement = document.querySelector('.vs');
  vsElement.innerHTML = '<div class="loader"></div>';
}

function setVS() {
  const vsElement = document.querySelector('.vs');
  vsElement.style['background-color'] = '#f44336';
  vsElement.innerHTML = '<span>VS</span>'; 
}

function setError() {
  const vsElement = document.querySelector('.vs');
  
  vsElement.style['background-color'] = '#f44336';
  vsElement.innerHTML = '<i class="fa fa-refresh" aria-hidden="true"></i>';
  vsElement.style['cursor'] = 'pointer';
  
  vsElement.onclick = () => {
    vsElement.style['cursor'] = 'default';
    newRound();
  };
}

function setCorrect() {
  const vsElement = document.querySelector('.vs');
  vsElement.style['background-color'] = '#4caf50';
  vsElement.innerHTML = '<i class="fa fa-check"></i>';
}

function setWrong() {
  const vsElement = document.querySelector('.vs');
  vsElement.style['background-color'] = '#F44336';
  vsElement.innerHTML = '<i class="fa fa-close"></i>';
}

function setEqual() {
  const vsElement = document.querySelector('.vs');
  vsElement.style['background-color'] = '#3f51b5';
  vsElement.innerHTML = '<i class="fa fa-equals"></i>'; 
}

function compareArticlesViews(articles, selectedArticle) {
  if(alreadyClicked)
  	return;

  alreadyClicked = true;

  let victorious = -1;

  if (articles[0].views > articles[1].views) {
  	victorious = 0;
  } else {
  	victorious = 1;
  }

  showViews(articles);

  if(victorious === selectedArticle) {
  	setCorrect();
  	score++;
  	setTimeout(newRound, roundWaitingTime);
  } else if(victorious === -1) {
    setEqual();
    setTimeout(newRound, roundWaitingTime);
  } else {
  	setWrong();
  	setTimeout(gameOver, roundWaitingTime - 1000);
  }

}


function gameOver() {
  if(score > highScore) {
    localStorage.setItem('high-score', score);
    highScore = score;
  }

  showGameOverScreen();
}

function showGameOverScreen() {
  document.querySelector('.game-over').style['display'] = 'flex';
  document.querySelector('.game-over-highscore').innerText = `High Score: ${highScore}`;
  document.querySelector('.game-over-score').innerText = `Score: ${score}`;
} 

function closeGameOverScreen() {
  document.querySelector('.game-over').style['display'] = 'none';
}

function setArticleElements(articles) {
  document.querySelector('#image-1').style['background-image'] = `url(${articles[0].image})`;
  document.querySelector('#image-2').style['background-image'] = `url(${articles[1].image})`;

  document.querySelector('#image-1-name').innerText = articles[0].title;
  document.querySelector('#image-2-name').innerText = articles[1].title;

  document.querySelector('#image-1').onclick = () => compareArticlesViews(articles, 0);
  document.querySelector('#image-2').onclick = () => compareArticlesViews(articles, 1);
}

function clearViews() {
  document.querySelector('#image-1-views').innerText = ``;
  document.querySelector('#image-2-views').innerText = ``;	
}

function showViews(articles, views = [0, 0]) {
  setTimeout(() => {
  	if(articles[0].views !== views[0]) {
  	  if(articles[0].views - views[0] >= 100) {
  	  	views[0] += 100;
  	  } else if (articles[0].views - views[0] >= 10) {
  	    views[0]+= 10;
  	  } else {
  	  	views[0]++;
  	  }
  	}

  	if(articles[1].views !== views[1]) {
  	  if(articles[1].views - views[1] >= 100) {
  	  	views[1] += 100;
  	  } else if (articles[1].views - views[1] >= 10) {
  	    views[1]+= 10;
  	  } else {
  	  	views[1]++;
  	  }
  	}

    document.querySelector('#image-1-views').innerText = `${views[0]} views in last month`;
    document.querySelector('#image-2-views').innerText = `${views[1]} views in last month`;

    if(articles[0].views !== views[0] || articles[1].views !== views[1])
      showViews(articles, views)
  }, 10);
}

function closeMainPage() {
  document.querySelector('.main-page').style['display'] = 'none';
}

function openMainPage() {
  document.querySelector('.main-page').style['display'] = 'flex';
}

function goToMainPage() {
  openMainPage();
  newRound();
  closeGameOverScreen();
}

function setMainPageBackground(image) {
  document.querySelector('.main-page').style['background-image'] = `url(${image})`;
}

function start() {
  closeMainPage();
}

function tryAgain() {
  score = 0;
  closeGameOverScreen();
  newRound();
}

newRound();

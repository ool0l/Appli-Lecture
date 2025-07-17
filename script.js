const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancel-btn');
const searchBtn = document.getElementById('search-btn');
const bookInput = document.getElementById('book-title-input');

let resultsDiv = document.getElementById('results');
if (!resultsDiv) {
  resultsDiv = document.createElement('div');
  resultsDiv.id = 'results';
  document.querySelector('.modal-content').appendChild(resultsDiv);
}

addBookBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  closeModal();
});

function closeModal() {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
  bookInput.value = "";
  document.getElementById('book-pages-input').value = "";
  resultsDiv.innerHTML = "";
}

searchBtn.addEventListener('click', async () => {
  const title = bookInput.value.trim();
  if (!title) return;

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=10`);
  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    resultsDiv.innerHTML = "<p>Aucun résultat trouvé.</p>";
    return;
  }

  resultsDiv.innerHTML = "";

  data.items.forEach((item) => {
    const book = item.volumeInfo;

    // Forcer HTTPS sur l'image thumbnail (Google Books parfois retourne HTTP)
    const thumbnail = book.imageLinks?.thumbnail ? book.imageLinks.thumbnail.replace(/^http:/, 'https:') : null;

    const resultCard = document.createElement('div');
    resultCard.className = 'book-card';
    resultCard.innerHTML = `
      ${thumbnail ? `<img src="${thumbnail}" alt="Couverture" style="max-height: 100px;">` : ""}
      <div class="info">
        <h4>${book.title || "Titre inconnu"}</h4>
        <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
        <p><strong>Pages:</strong> ${book.pageCount || "?"}</p>
      </div>
      <button class="select-book">Ajouter ce livre</button>
    `;

    const selectBtn = resultCard.querySelector('.select-book');
    selectBtn.addEventListener('click', () => {
      const pagesInput = document.getElementById('book-pages-input');
      const manualPages = parseInt(pagesInput.value.trim());
      const finalPages = !isNaN(manualPages) && manualPages > 0 ? manualPages : (book.pageCount || 0);

      book.pageCount = finalPages;
      book.thumbnail = thumbnail; // ajoute la miniature forcée en https
      addBookToList(book);
      closeModal();
      saveBooks(); // Sauvegarder à l'ajout aussi
    });

    resultsDiv.appendChild(resultCard);
  });
});

// Fonction pour sauvegarder les livres dans localStorage
function saveBooks() {
  const booksCurrent = [];
  document.querySelectorAll('#books-current .book-card').forEach(card => {
    booksCurrent.push(extractBookData(card));
  });
  const booksFinished = [];
  document.querySelectorAll('#books-finished .book-card').forEach(card => {
    booksFinished.push(extractBookData(card));
  });
  localStorage.setItem('myBooksCurrent', JSON.stringify(booksCurrent));
  localStorage.setItem('myBooksFinished', JSON.stringify(booksFinished));
}

// Fonction pour extraire les données d'un livre depuis la carte
function extractBookData(card) {
  const title = card.querySelector('h3')?.textContent || 'Titre inconnu';
  const authorsText = card.querySelector('p')?.textContent || '';
  const authorsMatch = authorsText.match(/Auteur\(s\):\s(.+)/);
  const authors = authorsMatch ? authorsMatch[1].split(', ') : [];

  return {
    title,
    authors,
    pageCount: parseInt(card.querySelector('p:nth-of-type(2)')?.textContent.replace(/\D/g, '')) || 0,
    pagesRead: parseInt(card.querySelector('.pages-read')?.value) || 0,
    personalRating: parseInt(card.querySelector('.personal-rating')?.value) || 0,
    personalNote: card.querySelector('.personal-note')?.value || "", // ✅ NOUVEAU
    thumbnail: card.querySelector('img')?.src?.replace(/^http:/, 'https:') || null
  };
}


// Fonction pour charger les livres depuis localStorage
function loadBooks() {
  const booksCurrent = JSON.parse(localStorage.getItem('myBooksCurrent') || '[]');
  booksCurrent.forEach(book => {
    addBookToList(book, 'books-current');
  });
  const booksFinished = JSON.parse(localStorage.getItem('myBooksFinished') || '[]');
  booksFinished.forEach(book => {
    addBookToList(book, 'books-finished', true);
  });
}

const searchFinishedInput = document.getElementById('search-finished');

if (searchFinishedInput) {
  searchFinishedInput.addEventListener('input', () => {
    const filter = searchFinishedInput.value.toLowerCase();
    const finishedBooks = document.querySelectorAll('#books-finished .book-card');

    finishedBooks.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const authors = card.querySelector('p').textContent.toLowerCase();
      if (title.includes(filter) || authors.includes(filter)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// Ajouter un livre dans la liste (param 2 = conteneur, 3 = est fini)
function addBookToList(book, containerId = 'books-current', isFinished = false) {
  const bookCard = document.createElement('div');
  bookCard.className = 'book-card';

  const totalPages = book.pageCount || 0;
  const pagesRead = book.pagesRead || 0;
  const rating = book.personalRating || 0;

  bookCard.innerHTML = `
    <h3>${book.title || "Titre inconnu"}</h3>
    <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
    <p><strong>Pages totales:</strong> ${totalPages}</p>

    <label>
      Pages lues: 
      <input type="number" class="pages-read" min="0" max="${totalPages}" value="${pagesRead}" style="width:60px;" ${isFinished ? "disabled" : ""} />
    </label>

    <div class="progress-bar-outer" style="background:#eee; border-radius:10px; overflow:hidden; height: 20px; margin: 10px 0;">
      <div class="progress-bar-inner" style="background:#4caf50; height: 100%; width: 0%; transition: width 0.5s ease;"></div>
    </div>
    <p>Progression : <span class="progress">0%</span></p>

    <label>
      Note perso (0-10) : 
      <input type="range" class="personal-rating" min="0" max="10" value="${rating}" step="1" ${isFinished ? "disabled" : ""} />
      <span class="rating-value">${rating}</span>/10
    </label>

    <label>
      📝 Note perso :
      <textarea class="personal-note" rows="3" placeholder="Ton avis, un résumé, une citation...">${book.personalNote || ""}</textarea>
    </label>


    <img src="${book.thumbnail || 'https://dummyimage.com/120x160/cccccc/555555&text=Aucune+image'}" alt="Couverture" style="max-height: 150px; display: block; margin-top: 10px;">

    ${!isFinished ? `<button class="delete-book" style="margin-top: 10px;">🗑️ Supprimer</button>` : ''}
  `;

  // Supprimer livre (que si pas fini)
  if (!isFinished) {
    const deleteBtn = bookCard.querySelector('.delete-book');
    deleteBtn.addEventListener('click', () => {
      if(confirm(`Supprimer "${book.title}" ?`)) {
        bookCard.remove();
        saveBooks();
      }
    });
  }

  const pagesReadInput = bookCard.querySelector('.pages-read');
  const progressSpan = bookCard.querySelector('.progress');
  const progressBar = bookCard.querySelector('.progress-bar-inner');

  function updateProgress() {
    let val = parseInt(pagesReadInput.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > totalPages) val = totalPages;
    pagesReadInput.value = val;
    const percent = totalPages === 0 ? 0 : Math.round((val / totalPages) * 100);
    progressSpan.textContent = `${percent}%`;
    progressBar.style.width = percent + '%';

    // Confettis + déplacement automatique si livre pas encore fini
    if (!isFinished && percent === 100 && !bookCard.classList.contains('completed')) {
      bookCard.classList.add('completed');

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        document.getElementById('books-finished').appendChild(bookCard);
        // Désactive les inputs dans "Livres lus"
        pagesReadInput.disabled = true;
        ratingInput.disabled = true;
        saveBooks();
      }, 500);
    } else {
      saveBooks();
    }
  }

  pagesReadInput.addEventListener('input', updateProgress);
  updateProgress(); // mise à jour initiale

  // Note perso + sauvegarde
  const ratingInput = bookCard.querySelector('.personal-rating');
  const ratingValue = bookCard.querySelector('.rating-value');
  ratingInput.addEventListener('input', () => {
    ratingValue.textContent = ratingInput.value;
    saveBooks();
  });

  const noteInput = bookCard.querySelector('.personal-note');
    noteInput.addEventListener('input', () => {
    saveBooks();
  });


  document.getElementById(containerId).appendChild(bookCard);
}

// Au chargement, restore la liste
window.addEventListener('load', () => {
  loadBooks();
});

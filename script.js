const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancel-btn');
const searchBtn = document.getElementById('search-btn');
const booksContainer = document.getElementById('books-container');
const bookInput = document.getElementById('book-title-input');

// Crée une div pour afficher les résultats (une seule fois)
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

  resultsDiv.innerHTML = ""; // Vide les anciens résultats

  data.items.forEach((item) => {
    const book = item.volumeInfo;

    const resultCard = document.createElement('div');
    resultCard.className = 'book-card';
    resultCard.innerHTML = `
      <h4>${book.title || "Titre inconnu"}</h4>
      <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
      <p><strong>Pages:</strong> ${book.pageCount || "?"}</p>
      ${book.imageLinks?.thumbnail ? `<img src="${book.imageLinks.thumbnail}" alt="Couverture" style="max-height: 120px;">` : ""}
      <button class="select-book">Ajouter ce livre</button>
    `;

    const selectBtn = resultCard.querySelector('.select-book');
    selectBtn.addEventListener('click', () => {
      addBookToList(book);
      closeModal();
    });

    resultsDiv.appendChild(resultCard);
  });
});

function addBookToList(book) {
  const bookCard = document.createElement('div');
  bookCard.className = 'book-card';
  bookCard.innerHTML = `
    <h3>${book.title || "Titre inconnu"}</h3>
    <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
    <p><strong>Pages:</strong> ${book.pageCount || "?"}</p>
    ${book.imageLinks?.thumbnail ? `<img src="${book.imageLinks.thumbnail}" alt="Couverture" style="max-height: 150px;">` : ""}
    <button class="delete-book">🗑️ Supprimer</button>
  `;

  const deleteBtn = bookCard.querySelector('.delete-book');
  deleteBtn.addEventListener('click', () => {
    bookCard.remove();
  });

  booksContainer.appendChild(bookCard);
}

const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancel-btn');
const searchBtn = document.getElementById('search-btn');
const booksContainer = document.getElementById('books-container');

addBookBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
});

searchBtn.addEventListener('click', async () => {
  const title = document.getElementById('book-title-input').value.trim();
  if (!title) return;

  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}`);
  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    alert("Aucun livre trouvé.");
    return;
  }

  const book = data.items[0].volumeInfo;

  const bookCard = document.createElement('div');
  bookCard.className = 'book-card';
  bookCard.innerHTML = `
    <h3>${book.title || "Titre inconnu"}</h3>
    <p><strong>Auteur(s):</strong> ${book.authors ? book.authors.join(", ") : "Inconnu"}</p>
    <p><strong>Pages:</strong> ${book.pageCount || "?"}</p>
    ${book.imageLinks?.thumbnail ? `<img src="${book.imageLinks.thumbnail}" alt="Couverture" style="max-height: 150px;">` : ""}
  `;

  booksContainer.appendChild(bookCard);

  modal.classList.add('hidden');
  overlay.classList.add('hidden');
  document.getElementById('book-title-input').value = "";
});

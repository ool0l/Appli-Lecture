const addBookBtn = document.getElementById('add-book-btn');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const cancelBtn = document.getElementById('cancel-btn');
const searchBtn = document.getElementById('search-btn');

addBookBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
});

searchBtn.addEventListener('click', () => {
  const title = document.getElementById('book-title-input').value.trim();
  if (title) {
    alert("Tu as cherché : " + title);
    // Plus tard : lancer la recherche Google Books ici
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
  }
});

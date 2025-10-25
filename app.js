// app.js
import { initFirebase, signInAnon, signOutUser, onAuthChange, addTodo, subscribeTodos, updateTodo, deleteTodo } from './firebase.js';

initFirebase(); // ensure firebase is initialized

// DOM refs
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const todosEl = document.getElementById('todos');
const countEl = document.getElementById('count');
const btnSignIn = document.getElementById('btn-signin');
const btnSignOut = document.getElementById('btn-signout');
const userInfoEl = document.getElementById('user-info');
const btnClearCompleted = document.getElementById('clear-completed');
const btnDeleteAll = document.getElementById('delete-all');

let unsubscribe = () => {};

function escapeHtml(str = '') {
  return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function renderTodos(items) {
  todosEl.innerHTML = '';
  if (!items.length) {
    todosEl.innerHTML = `<li class="muted small-muted">No tasks yet — add one above</li>`;
    countEl.textContent = `0 tasks`;
    return;
  }
  countEl.textContent = `${items.length} task${items.length>1? 's':''}`;
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = item.id;
    const checked = item.data.completed ? 'checked' : '';
    li.innerHTML = `
      <input class="form-check-input me-2" type="checkbox" ${checked} />
      <div class="todo-text ${item.data.completed ? 'completed': ''}">${escapeHtml(item.data.text || '')}</div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-clear edit">Edit</button>
        <button class="btn btn-sm btn-clear del">Delete</button>
      </div>
    `;
    // toggle
    li.querySelector('input[type=checkbox]').addEventListener('change', async (e) => {
      try {
        await updateTodo(item.id, { completed: e.target.checked });
      } catch (err) {
        console.error(err);
        alert('Update failed');
      }
    });
    // delete
    li.querySelector('.del').addEventListener('click', async () => {
      if (!confirm('Delete this task?')) return;
      try {
        await deleteTodo(item.id);
      } catch (err) { console.error(err); alert('Delete failed'); }
    });
    // edit
    li.querySelector('.edit').addEventListener('click', async () => {
      const newText = prompt('Edit task', item.data.text);
      if (newText === null) return;
      if (newText.trim() === '') return alert('Empty text not allowed');
      try {
        await updateTodo(item.id, { text: newText.trim() });
      } catch (err) { console.error(err); alert('Update failed'); }
    });

    todosEl.appendChild(li);
  });
}

// subscribe when user signs in
function startListening() {
  // unsubscribe previous
  try { unsubscribe(); } catch(e){}
  unsubscribe = subscribeTodos(renderTodos) || (() => {});
}

// basic sign-in flow
btnSignIn.addEventListener('click', async () => {
  try {
    await signInAnon();
  } catch (err) {
    console.error(err);
    alert('Sign-in failed: ' + (err.message || err));
  }
});
btnSignOut.addEventListener('click', async () => {
  try {
    await signOutUser();
  } catch (err) {
    console.error(err);
    alert('Sign-out failed');
  }
});

// add todo
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  try {
    await addTodo(text);
    input.value = '';
    input.focus();
  } catch (err) {
    console.error(err);
    alert('Add failed: ' + (err.message || ''));
  }
});

// clear completed (batch delete)
// Note: this app uses client-side deletes per doc; for many docs you should use Cloud Functions or batch deletes
btnClearCompleted.addEventListener('click', async () => {
  if (!confirm('Remove completed tasks?')) return;
  // get current items in DOM and delete checked ones
  const items = Array.from(document.querySelectorAll('.todo-item'));
  for (const li of items) {
    const cb = li.querySelector('input[type=checkbox]');
    if (cb && cb.checked) {
      const id = li.dataset.id;
      try { await deleteTodo(id); } catch(e){ console.error(e); }
    }
  }
});

// delete all
btnDeleteAll.addEventListener('click', async () => {
  if (!confirm('Delete ALL tasks? This cannot be undone.')) return;
  const items = Array.from(document.querySelectorAll('.todo-item'));
  for (const li of items) {
    const id = li.dataset.id;
    try { await deleteTodo(id); } catch(e){ console.error(e); }
  }
});

// auth state watcher
onAuthChange(user => {
  if (user) {
    userInfoEl.textContent = `Signed in — uid: ${user.uid}`;
    startListening();
  } else {
    userInfoEl.textContent = `Not signed in`;
    // unsubscribe and clear UI
    try { unsubscribe(); } catch(e){}
    todosEl.innerHTML = '';
    countEl.textContent = '0 tasks';
  }
});

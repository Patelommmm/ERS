// Comments part of the product details page
async function fetchComments(productId) {
    const res = await apiFetch(`${API}/comments/${encodeURIComponent(productId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.comments || [];
}

function commentItemHtml(c) {
    return `
        <dt>${escapeHtml(c.renter?.name || 'Renter')}</dt>
        <dd><span class="pill pill-outline">${escapeHtml(c.commentDate)}</span>${escapeHtml(c.comment)}</dd>`;
}

function commentFormHtml() {
    return `
        <form class="filter-row comment-form">
            <input type="text" name="comment" class="search" maxlength="500" placeholder="Share your experience with this equipment" required>
            <button type="submit" class="btn">Post comment</button>
        </form>`;
}

async function postComment(productId, text) {
    const res = await apiFetch(`${API}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, comment: text })
    });
    const data = await res.json();
    if (!res.ok) alert(data.message || 'Could not post comment');
    return res.ok;
}

// Everyone can read comments, only Renters get the comment box
async function renderCommentSection(container, product, user) {
    const isRenter = user.role === 'Renter';
    const comments = await fetchComments(product._id);
    // Hide the section if the API does not allow this user to read comments
    if (!comments) {
        container.innerHTML = '';
        return;
    }
    const refresh = () => renderCommentSection(container, product, user);
    const emptyText = isRenter ? 'No comments yet. Be the first to comment.' : 'No comments yet.';

    container.innerHTML = `
        <h3>Comments (${comments.length})</h3>
        ${isRenter ? commentFormHtml() : ''}
        ${comments.length
            ? `<dl class="facts">${comments.slice().reverse().map(commentItemHtml).join('')}</dl>`
            : `<p>${emptyText}</p>`}`;

    const form = container.querySelector('.comment-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const text = form.comment.value.trim();
        if (!text) return;
        const btn = form.querySelector('button[type="submit"]');
        await buffer(btn, async () => {
            if (await postComment(product._id, text)) refresh();
        });
    });
}

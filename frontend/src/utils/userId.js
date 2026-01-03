const USER_ID_KEY = 'discussion_user_id';

export function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = generateUniqueId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}-${random2}`;
}

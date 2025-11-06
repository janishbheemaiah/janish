# TODO: Add Like and Comment Functionality to Photos in User Profiles

## Backend Changes
- [x] Update Photo model to include comments array
- [x] Add GET /:id/comments route to fetch comments for a photo
- [x] Add POST /:id/comments route to add a new comment to a photo
- [x] Ensure like functionality is working (already exists)

## Frontend Changes
- [x] Update PublicProfilePage.tsx to add like button for each photo
- [x] Add comment section below each photo with display and add comment form
- [x] Handle API calls for liking and commenting
- [x] Update photo display to show real-time like counts and comments
- [x] Create MessagesPage.tsx for user-to-user messaging
- [x] Add Messages route to App.tsx
- [x] Add Messages link to Navbar
- [x] Update Message button in PublicProfilePage to link to Messages page

## Testing
- [x] Test liking photos on public profiles
- [x] Test adding comments on photos
- [x] Ensure only authenticated users can like/comment
- [x] Verify like counts update correctly
- [x] Test messaging functionality between users

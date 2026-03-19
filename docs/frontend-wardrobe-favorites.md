# Frontend Integration: Wardrobe Favorites, Rename, and Outfit Generation

This API now supports:

- marking wardrobe items as favorites
- renaming wardrobe items with a dedicated endpoint
- telling outfit generation whether favorites should matter

Base API prefix: `/api`

## 1. Wardrobe Item Shape

Wardrobe items now include:

```json
{
  "id": "uuid",
  "name": "Black Blazer",
  "isFavorite": true,
  "category": "outerwear",
  "subcategory": "blazer",
  "imageUrl": "https://...",
  "aiDescription": "Tailored black blazer for smart casual looks.",
  "seasons": ["spring", "autumn"],
  "temperatureRange": { "minC": 10, "maxC": 22 },
  "occasions": ["work", "formal"],
  "tags": ["classic", "tailored"]
}
```

## 2. Favorites in Wardrobe

### Create item manually

`POST /api/wardrobe`

```json
{
  "name": "Black Blazer",
  "isFavorite": true,
  "category": "outerwear",
  "subcategory": "blazer",
  "imageUrl": "https://example.com/blazer.png"
}
```

### Upload item and mark as favorite immediately

`POST /api/wardrobe/upload`

Multipart form fields:

- `file`: image file, required
- `name`: optional
- `categoryHint`: optional
- `isFavorite`: optional boolean

### Toggle favorite on an existing item

`PATCH /api/wardrobe/:id`

```json
{
  "isFavorite": true
}
```

To remove favorite:

```json
{
  "isFavorite": false
}
```

### Wardrobe listing behavior

`GET /api/wardrobe`

Favorites are returned first, then the rest ordered by newest first.

`GET /api/wardrobe/category/:category`

Category lists also return favorites first.

## 3. Rename a Wardrobe Item

Use the dedicated rename endpoint:

`PATCH /api/wardrobe/:id/rename`

```json
{
  "name": "Charcoal Oversized Blazer"
}
```

You can still rename through the generic `PATCH /api/wardrobe/:id`, but the dedicated endpoint is better for a simple rename action in the UI.

## 4. Outfit Generation with Favorites

Use:

`POST /api/outfits/generate`

New optional field:

```json
{
  "favoritesMode": "prefer"
}
```

Allowed values:

- `prefer`: bias outfit generation toward favorite items when they still fit the event and weather
- `neutral`: no special treatment for favorites

### Example request

```json
{
  "customEventText": "Dinner with friends at a rooftop bar",
  "date": "today",
  "favoritesMode": "prefer"
}
```

### Example response

```json
{
  "outfit_items": [
    "wardrobe-item-id-1",
    "wardrobe-item-id-2",
    "wardrobe-item-id-3"
  ],
  "explanation": "Balanced for your event and weather, with preference given to favorite items when suitable.",
  "weather_match": true,
  "style_match": true
}
```

## 5. Recommended Frontend UX

For generation, ask the user one simple choice before calling the API:

- `Use my favorites`
- `No difference`

Map that choice to:

- `Use my favorites` -> `favoritesMode: "prefer"`
- `No difference` -> `favoritesMode: "neutral"`

For wardrobe items:

- show a favorite toggle on each item card
- keep rename as a simple edit action on the item details or overflow menu

## 6. Suggested Frontend Flow

1. Load wardrobe with `GET /api/wardrobe`.
2. Let user toggle favorites using `PATCH /api/wardrobe/:id`.
3. Let user rename items using `PATCH /api/wardrobe/:id/rename`.
4. When user starts outfit generation, ask:
   `Use your favorites or no difference?`
5. Call `POST /api/outfits/generate` with `favoritesMode`.
6. Use the returned `outfit_items` to build the `clothingItems` payload for `/api/ai/generate-outfit` if you also want the virtual try-on image.

## 7. Notes

- Favorites affect outfit recommendation, not the low-level image renderer directly.
- The recommender still prioritizes obvious weather and event fit. Favorites are a preference, not a hard rule.

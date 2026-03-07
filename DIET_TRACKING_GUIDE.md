# 🥗 AI-Powered Diet Tracking - User Guide

## Overview

The diet tracking feature has been completely redesigned with **AI automation** to minimize manual entry. Now you can just take a photo of your meal, and AI will analyze it for you!

## ✨ Key Features

### 1. **AI Meal Analysis** 🤖

- Take a photo or upload an image of your food
- Google Gemini AI automatically identifies the meal
- Extracts nutritional information (calories, protein, carbs, fat)
- Detects ingredients and portion sizes

### 2. **Smart Meal Library** 📚

- Every AI-analyzed meal is saved to your personal library
- Quick search as you type (autocomplete)
- Popular meals section shows frequently logged items
- Next time you eat the same meal = instant logging (no API calls)

### 3. **Mobile-First Design** 📱

- Optimized for quick meal logging on-the-go
- Camera capture directly from your phone
- Simple, clean interface focused on what matters
- Touch-friendly buttons and inputs

### 4. **Simplified Tracking** 🎯

- No more complex goals or streaks
- Just log meals and see your daily totals
- Focus on awareness, not restrictions
- Clean daily summary cards

## 🚀 How to Use

### Logging a New Meal

**Option 1: Search Your History**

1. Open the Diet section on Today page
2. Start typing the meal name in the search box
3. Select from your previous meals
4. Confirm and log instantly!

**Option 2: Take a Photo**

1. Tap the **"Take Photo"** button
2. Capture your meal with camera
3. AI analyzes the image (takes 2-3 seconds)
4. Review and edit the AI's suggestions
5. Tap **"Get Nutrition"** to fetch macros
6. Confirm and log!

**Option 3: Upload Image**

1. Tap the **"Upload Image"** button
2. Select a food photo from your gallery
3. Follow same flow as camera capture

### Viewing Your Progress

- Your daily totals appear at the top (Calories, Protein, Carbs, Fat)
- Each meal log shows time, macros, and serving size
- Swipe to see delete button (or hover on desktop)

### Quick Re-logging

- Open Diet section
- See "Recent & Popular" meals
- Tap any meal to instantly log it again
- Perfect for meals you eat frequently!

## 🎨 What Changed

### Removed ❌

- ~~Goal setting~~ (no more targets)
- ~~Streak tracking~~ (no more pressure)
- ~~Progress bars~~ (no comparisons)
- ~~Weekly analytics~~ (simplified)

### Added ✅

- AI image analysis with Gemini AI
- Personal meal library with search
- Smart autocomplete
- Category detection (breakfast/lunch/dinner/snack)
- Auto-filled nutritional data
- Image thumbnails for meals

## 💡 Pro Tips

1. **Build Your Library**: The more you log, the faster it gets. After the first week, most meals will be quick taps.

2. **Good Photo = Better Results**:
   - Take photos in good lighting
   - Center the food in frame
   - Avoid cluttered backgrounds
   - Multiple items? AI will detect all of them!

3. **Edit Before Saving**: AI is smart but not perfect. Always review the suggested values.

4. **Use Categories**: Categorizing meals helps you track eating patterns.

5. **Portion Awareness**: AI estimates portions, but you know your serving size best.

## 🔐 Privacy & Storage

- **Images**: Stored securely on ImageKit CDN
- **AI Analysis**: Processed by Google Gemini (no training on your data)
- **Your Data**: Meal library is private to your account
- **Delete Anytime**: Remove meals from library + all their logs

## 🐛 Troubleshooting

**AI analysis failed?**

- Check your internet connection
- Ensure image is clear and well-lit
- Try uploading instead of camera
- Can always enter manually as fallback

**Search not finding meals?**

- Type at least 2 characters
- Try different keywords (e.g., "chicken" finds "Chicken Salad")
- Popular meals show automatically if search is empty

**Nutrition seems off?**

- AI estimates based on typical servings
- Edit values before logging
- Add notes for custom portions
- Values improve as you log more

## 📊 Technical Details

### AI Models Used

- **Image Analysis**: Gemini 1.5 Flash
- **Nutrition Extraction**: Gemini 1.5 Flash
- **Image Storage**: ImageKit CDN

### Free Tier Limits

- **Gemini AI**: 1,500 requests/day (plenty for personal use)
- **ImageKit**: 20GB bandwidth + storage/month

### Data Stored Per Meal

- Name, description, AI analysis
- Image URL and thumbnail
- Calories, protein, carbs, fat
- Serving size and category
- Tags and ingredients
- Times logged and last logged date

## 🎯 Philosophy

This redesign is about **awareness without obsession**:

- See what you're eating
- Understand nutritional patterns
- Make informed choices
- No guilt, no pressure, just data

The goal isn't perfection—it's consistency and mindfulness.

---

**Need Help?** Check the API_KEYS_SETUP.md for configuration details.

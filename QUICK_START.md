# 🚀 Quick Start - Database Schema Migration

## TL;DR - Just Do This 👇

### 1. Backup (optional)
If you have data you care about, back it up first.

### 2. Run Migration SQL
```
Open: Supabase Dashboard → SQL Editor
↓
New Query
↓
Copy ALL from: supabase/migration_v2_improved_schema.sql
↓
Click: Run (⚡ button)
↓
Verify: No errors, see 6 tables created
```

### 3. Load Demo Data
```
New Query
↓
Copy ALL from: supabase/demo_data_v2.sql
↓
Click: Run (⚡ button)
↓
Verify: 8 profiles created
```

### 4. Test in App
```
Stop dev server: Ctrl+C
↓
npm run dev
↓
http://localhost:5174
↓
Sign up as Patient → See address field ✓
↓
Sign up as Professional → See specialty dropdown ✓
```

---

## What Changed?

### Database
- ✅ No more phone duplicates
- ✅ Email now in profiles
- ✅ Patient address only in patients table
- ✅ Professional specialty in professionals table

### Form
- ✅ Patient signup shows: Address field
- ✅ Professional signup shows: Professional type, Specialty dropdown, License number
- ✅ Pre-filled specialty options (8 common ones) + custom

---

## Key Files

| File | Purpose | Action |
|------|---------|--------|
| `supabase/migration_v2_improved_schema.sql` | Create new schema | Run in SQL Editor |
| `supabase/demo_data_v2.sql` | Sample data | Run in SQL Editor |
| `src/components/Auth.jsx` | Signup form | Already updated ✓ |
| `src/App.jsx` | Profile creation | Already updated ✓ |

---

## Success Looks Like

1. ✅ Migration SQL runs (no errors)
2. ✅ Demo data loads (8 profiles)
3. ✅ App starts
4. ✅ Sign up as Patient → address field visible
5. ✅ Sign up as Professional → specialty dropdown visible
6. ✅ Data saved to correct tables

---

## Need Help?

### For detailed guide: 
→ Read `SCHEMA_MIGRATION_GUIDE.md`

### For step-by-step checklist: 
→ Follow `IMPLEMENTATION_CHECKLIST.md`

### For quick overview: 
→ Read `SCHEMA_REFACTOR_SUMMARY.md`

### For troubleshooting: 
→ Check `SCHEMA_MIGRATION_GUIDE.md` → Troubleshooting section

---

## Questions?

**Q: Will my existing data be deleted?**  
A: Yes - migration drops old tables. Back up first if needed.

**Q: Do I need to update anything else?**  
A: No - Auth.jsx and App.jsx are already updated.

**Q: What if migration fails?**  
A: Most common: try running migration script manually in pieces.

**Q: How do I verify it worked?**  
A: See IMPLEMENTATION_CHECKLIST.md for verification steps.

---

🎉 **You're ready to go! Run the migration SQL now!**

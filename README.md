# Ekip Yönetim Sistemi (Team Management App)

Bu proje, yöneticilerin ekipler oluşturabileceği, kullanıcıların takım koduyla bu ekiplere katılabileceği ve yönetici tarafından üyelere görev ile bitiş tarihi atanabileceği modern bir ekip yönetimi uygulamasıdır. 

## Kullanılan Teknolojiler
- **Next.js (App Router):** Ana iskelet yapısı.
- **Supabase:** Uygulama veritabanı, kimlik doğrulama, backend servisi.
- **Zustand:** İstemci tarafı (frontend) state (durum) yönetimi.
- **TanStack Query (React Query):** Supabase'den verileri çekmek, önbelleğe almak ve senkronize tutmak için kullanıldı.
- **Vanilla CSS:** Modern, lüks ve animasyonlu kullanıcı arayüzü tasarımı için.

## Kurulum ve Çalıştırma

### 1. Supabase ve Çevre Değişkenleri
Öncelikle [Supabase](https://supabase.com/)'de yeni bir proje oluşturun ve gerekli SQL tablolarını kurun. Ardından projenin ana dizininde bir `.env.local` dosyası oluşturup aşağıdaki bilgileri içine ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> **Not:** `.env.local` dosyası GitHub'a gönderilmez (ignored), bu nedenle güvenlidir.

### 2. Bağımlılıkları Yükleme ve Başlatma
Projede gerekli paketlerin kurulması gerekir (zaten kurulmuş olabilir, yinede kontrol ediniz):
```bash
npm install
npm run dev
```
Uygulamanızı tarayıcıda `http://localhost:3000` adresinden görüntüleyebilirsiniz.

## Proje Dosya Yapısı ve Kodun Neresinden Değişiklik Yapabilirsiniz?

Bu projeyi tek bir `main` (.js) dosyasına yazmak yerine modüler ve temiz bir mimari kullanılarak parçalara ayırdık. Değişim yapmak istediğiniz konuya göre aşağıdaki dosyalara bakabilirsiniz:

### Backend / Veritabanı
- **`src/lib/supabase.js`**: Uygulamanın Supabase ile olan bağlantısını kurar. Veritabanı yapılandırması buradan yapılır.

### State Yönetimi (Zustand) & Veri (React Query)
- **`src/store/useTeamStore.js`**: Frontend üzerinde "Hangi kullanıcı giriş yaptı?", "Şu an hangi takım açık?" gibi bilgileri global olarak tutar.
- **`src/providers/QueryProvider.jsx`**: Verileri sunucudan çekerken uygulamanın durumlarını sarmalar.

### Sayfalar (Pages - App Router)
- **`src/app/page.js`**: Sitenin açılış (Giriş / Kayıt) sayfasıdır. Kullanıcının giriş yapmasını sağlayan arayüzdür.
- **`src/app/dashboard/page.js`**: Başarıyla giriş yapan kullanıcının göreceği ana ekran. Takımları listeler, takım oluşturma veya katılma işlemleri burada yapılır.
- **`src/app/team/[id]/page.js`**: Takımın detay ekranı. Yönetici görev dağılımını bu ekranda yapar.

### Bileşenler (Components)
Modüler bileşenler `src/components/` klasörü altında bulunabilir:
- **`Auth.jsx`**: Kullanıcının uygulamaya giriş veya kayıt olma formudur.
- **`CreateTeamModal.jsx`**: Yeni takım oluşturmak için açılan pencere.
- **`JoinTeamModal.jsx`**: Takım kodunu girip ekibe dahil olmak için kullanılan pencere.
- **`TaskAssignmentModal.jsx`**: Yönetici (Admin) için üyelere "+" butonuyla görev atamak üzere açılan menü.
- **`UserList.jsx`**: Seçili takımdaki kullanıcıları ve görevlerini gösteren liste alanıdır.

### Tasarım (Görsellik & Animasyonlar)
- **`src/app/globals.css`**: Sitenin bütün renklerini, gölgelerini, yazı tiplerini (Google Fonts), şık cam efekti tasarımlarını (glassmorphism) ve animasyonları barındırır. Genel renkte veya düzende bir değişiklik yapmak isterseniz bu CSS dosyasını düzenleyebilirsiniz.

---

## Veritabanı Şeması (Supabase SQL Editor Üzerinde Çalıştırınız)

Veritabanınızı ayağa kaldırmak için uygulamanızın bağlı olduğu Supabase projesinde "SQL Editor" ekranına girip aşağıdaki kodu çalıştırın:

```sql
-- Ekipler Tablosu
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique not null,
  admin_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ekip Üyeleri (users tablosu ile teams birleşimi)
create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams on delete cascade not null,
  user_id uuid references auth.users not null,
  role text default 'member' check (role in ('admin', 'member')),
  user_email text, -- kolaylık olması için
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, user_id)
);

-- Görevler
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams on delete cascade not null,
  user_id uuid references auth.users not null,
  title text not null,
  due_date date not null,
  status text default 'pending' check (status in ('pending', 'in-progress', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Güvenlik İlkeleri (RLS - Row Level Security) 
-- Varsayılan olarak açık olan RLS kurallarını kapatıp test edebilir, 
-- Daha sonrasında güvenliği sağlamak için auth.uid() = user_id gibi kurallar ekleyebilirsiniz.
```

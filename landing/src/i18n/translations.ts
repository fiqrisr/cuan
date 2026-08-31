export const landingTranslations = {
  id: {
    meta: {
      title: 'Cuan - Catat keuangan dengan bahasa sehari-hari',
      description:
        'Cuan mengubah pesan obrolan jadi pembukuan rapi. Catat pengeluaran secara alami, pantau saldo antar rekening, dan tanya langsung soal keuanganmu.',
    },
    nav: {
      features: 'Fitur',
      howItWorks: 'Cara kerja',
      openApp: 'Buka aplikasi',
      privacy: 'Privasi',
      terms: 'Ketentuan',
      signIn: 'Masuk',
    },
    hero: {
      title: 'Catat pengeluaran,\nsecepat kamu mengetik.',
      subtitle:
        'Cuan mengubah pesan sehari-hari menjadi catatan pengeluaran yang rapi dan terverifikasi. Catat kopi saat kamu membelinya; tanya ke mana uangmu pergi dan dapatkan jawaban pasti.',
      startCta: 'Mulai mencatat',
      howItWorksCta: 'Lihat cara kerja',
    },
    chatPreview: {
      botName: 'Cuan',
      botSubtitle: 'Asisten keuanganmu',
      userMsg1: 'Kopi 25rb gopay',
      aiMsg1: 'Mencatat Rp25.000 ke Makanan & Minuman dari GoPay. Hari ini: Rp128.500.',
      userMsg2: 'Makanan minggu ini?',
      aiMsg2: 'Rp1.240.000 dari 9 transaksi. Ini 18% di bawah rata-rata mingguanmu.',
      aiStat2: 'Rp1.240.000 · 9 transaksi',
      inputPlaceholder: 'Catat pengeluaran, tanya saldo...',
      toolDone: 'Selesai',
    },
    features: {
      heading: 'Segala yang dibutuhkan pembukuan. Tanpa repotnya spreadsheet.',
      items: [
        {
          title: 'Catat lewat obrolan',
          body: 'Ketik seperti berbicara biasa. "Kopi 25rb gopay" otomatis tercatat dengan rekening, nominal, dan tanggal yang tepat tanpa form yang rumit.',
          visual: 'glass',
        },
        {
          title: 'Hitungan uang presisi',
          body: 'Nominal disimpan sebagai desimal presisi tetap, bukan floating point. Setiap transaksi menghitung ulang saldo seketika di database.',
          visual: 'gradient',
          stat: 'numeric(12,2)',
          statLabel: 'penyimpanan desimal eksak',
        },
        {
          title: 'Banyak rekening, satu utama',
          body: 'Tunai, dompet digital, dan rekening bank masing-masing memiliki saldo berjalan. Tentukan rekening utama untuk pencatatan otomatis.',
          visual: 'gradient',
        },
        {
          title: 'Privasi terjaga',
          body: 'Data keuanganmu tersimpan di database sendiri dengan otentikasi sesi. Tidak ada data yang dijual atau digunakan untuk melatih AI.',
          visual: 'glass',
        },
      ],
    },
    howItWorks: {
      label: 'Cara kerja',
      heading: 'Tiga detik dari pikiran ke pembukuan.',
      steps: [
        {
          title: 'Ketik pengeluaranmu',
          body: 'Buka obrolan dan jelaskan pengeluaran dengan bahasa santai. Campuran Bahasa Indonesia dan Inggris dalam urutan apa pun.',
        },
        {
          title: 'Cuan merapikannya',
          body: 'Asisten mengekstrak jumlah, kategori, rekening, dan tanggal, lalu mengonfirmasi sebelum mencatatnya ke database.',
        },
        {
          title: 'Saldo selalu akurat',
          body: 'Rekening terkait langsung diperbarui dalam transaksi yang sama. Total saldomu selalu tepat dan tidak pernah usang.',
        },
      ],
    },
    cta: {
      heading: 'Pengeluaran berikutnya tinggal satu kalimat menuju pembukuan rapi.',
      subtitle: 'Gratis untuk mulai. Datamu tetap milikmu.',
      button: 'Mulai mencatat sekarang',
    },
    privacy: {
      title: 'Privasi',
      updated: 'Terakhir diperbarui: Agustus 2026',
      intro:
        'Cuan adalah aplikasi pencatat pengeluaran pribadi. Halaman ini menjelaskan data apa yang disimpan dan tujuannya.',
      sections: [
        {
          title: 'Data yang disimpan',
          body: 'Akun Anda (nama, email, hash kata sandi), rekening keuangan, kategori, dan transaksi yang Anda catat. Pesan obrolan dikirim ke model bahasa untuk mengekstrak data terstruktur, lalu transaksi disimpan.',
        },
        {
          title: 'Yang tidak pernah dilakukan',
          body: 'Data Anda tidak pernah dijual, tidak pernah dibagikan ke pengiklan, dan tidak digunakan untuk melatih model AI. Otentikasi sesi dikelola langsung oleh sistem di database yang sama.',
        },
        {
          title: 'Pemrosesan AI',
          body: 'Pesan obrolan diproses oleh LLM melalui endpoint kompatibel OpenAI untuk klasifikasi intent dan ekstraksi entitas. Model hanya mengembalikan JSON terstruktur, tanpa membuat SQL atau data palsu.',
        },
        {
          title: 'Penghapusan data',
          body: 'Hapus akun Anda kapan saja dari menu profil di aplikasi. Semua rekening, kategori, transaksi, dan sesi akan ikut terhapus.',
        },
        {
          title: 'Kontak',
          body: 'Pertanyaan seputar kebijakan ini dapat disampaikan melalui repositori proyek atau kontak pengembang yang tertera.',
        },
      ],
    },
    terms: {
      title: 'Ketentuan Layanan',
      updated: 'Terakhir diperbarui: Agustus 2026',
      intro:
        'Cuan adalah aplikasi pencatat keuangan pribadi yang disediakan apa adanya. Dengan menggunakan layanan ini, Anda menyetujui ketentuan berikut.',
      sections: [
        {
          title: 'Layanan',
          body: 'Cuan membantu Anda mencatat pengeluaran melalui percakapan bahasa sehari-hari, mengelola rekening, dan menganalisis pengeluaran. Ini adalah alat pencatatan, bukan nasihat keuangan.',
        },
        {
          title: 'Data Anda',
          body: 'Anda adalah pemilik penuh data Anda. Anda bertanggung jawab atas keakuratan data yang dimasukkan dan menjaga kerahasiaan akun Anda.',
        },
        {
          title: 'Ketersediaan',
          body: 'Layanan disediakan berdasarkan upaya terbaik (best-effort) tanpa jaminan ketersediaan mutlak. Disarankan untuk mencadangkan data penting secara berkala.',
        },
        {
          title: 'Penggunaan yang wajar',
          body: 'Dilarang menggunakan layanan untuk aktivitas yang melanggar hukum atau mencoba mengakses data pengguna lain.',
        },
        {
          title: 'Perubahan ketentuan',
          body: 'Ketentuan ini dapat disesuaikan seiring perkembangan proyek. Perubahan penting akan dicantumkan di halaman ini.',
        },
      ],
    },
  },
  en: {
    meta: {
      title: 'Cuan - Personal finance, written in plain words',
      description:
        'Cuan turns chat into a ledger. Log expenses in natural language, keep exact balances across accounts, and ask your money questions directly.',
    },
    nav: {
      features: 'Features',
      howItWorks: 'How it works',
      openApp: 'Open app',
      privacy: 'Privacy',
      terms: 'Terms',
      signIn: 'Sign in',
    },
    hero: {
      title: 'Your expenses,\nas fast as you can type them.',
      subtitle:
        'Cuan turns everyday chat into structured, double-checked expense records. Log a coffee the moment you buy it; ask where your money went and get a real answer.',
      startCta: 'Start keeping books',
      howItWorksCta: 'See how it works',
    },
    chatPreview: {
      botName: 'Cuan',
      botSubtitle: 'Your financial assistant',
      userMsg1: 'Coffee 25k gopay',
      aiMsg1: 'Logged Rp25.000 to Food & Dining from GoPay. Today: Rp128.500.',
      userMsg2: 'Food this week?',
      aiMsg2: 'Rp1.240.000 across 9 transactions. That is 18% under your weekly average.',
      aiStat2: 'Rp1.240.000 · 9 entries',
      inputPlaceholder: 'Log an expense, ask a question...',
      toolDone: 'Completed',
    },
    features: {
      heading: 'Everything a ledger should be. Nothing a spreadsheet forces on you.',
      items: [
        {
          title: 'Chat-first logging',
          body: 'Type the way you talk. "Coffee 25k gopay" becomes a categorized transaction with the right account, amount, and date. No forms, no dropdowns.',
          visual: 'glass',
        },
        {
          title: 'Exact money math',
          body: 'Amounts are stored as fixed-precision decimals, never floats. Every write recalculates the account balance in the same database transaction, so the books always reconcile.',
          visual: 'gradient',
          stat: 'numeric(12,2)',
          statLabel: 'exact decimal storage',
        },
        {
          title: 'Multiple accounts, one default',
          body: 'Cash, e-wallets, and bank accounts each keep a running balance. Set a default and chat entries without an account land there automatically.',
          visual: 'gradient',
        },
        {
          title: 'Private by default',
          body: 'Your ledger lives in your own database behind session auth. Nothing is shared, sold, or fed back into training data.',
          visual: 'glass',
        },
      ],
    },
    howItWorks: {
      label: 'How it works',
      heading: 'Three seconds from thought to ledger.',
      steps: [
        {
          title: 'Say what you spent',
          body: 'Open the chat and describe the expense in plain language. Any mix of English and Bahasa, in any order.',
        },
        {
          title: 'Cuan structures it',
          body: 'The assistant extracts amount, category, account, and date, then shows you the entry before it writes.',
        },
        {
          title: 'Balances stay true',
          body: 'The linked account recalculates in the same transaction. Totals are never stale, never approximate.',
        },
      ],
    },
    cta: {
      heading: 'Your next expense is one sentence away from the books.',
      subtitle: 'Free to start. Your data stays yours.',
      button: 'Start keeping books',
    },
    privacy: {
      title: 'Privacy',
      updated: 'Last updated: August 2026',
      intro:
        'Cuan is a personal expense tracker. This page explains, in plain language, what data the service stores and why.',
      sections: [
        {
          title: 'What is stored',
          body: 'Your account (name, email, password hash), your financial accounts, categories, and the transactions you log. Chat messages are sent to a language model to extract structured expense data; the resulting transactions are what get saved.',
        },
        {
          title: 'What is never done',
          body: 'Your data is never sold, never shared with advertisers, and never used to train models. Session authentication is handled by better-auth against the same database that holds your ledger.',
        },
        {
          title: 'AI processing',
          body: 'Chat messages are processed by an LLM through an OpenAI-compatible endpoint to classify intent and extract amounts, categories, and accounts. The model returns structured JSON only; it does not generate SQL or invent figures.',
        },
        {
          title: 'Deletion',
          body: 'Delete your account from the profile page in the app. Your accounts, categories, transactions, and sessions are removed with it.',
        },
        {
          title: 'Contact',
          body: 'Questions about this policy: open an issue on the project repository or reach the maintainer through the contact details listed there.',
        },
      ],
    },
    terms: {
      title: 'Terms of use',
      updated: 'Last updated: August 2026',
      intro:
        'Cuan is a personal expense tracker provided as-is. By using the service you agree to these terms.',
      sections: [
        {
          title: 'The service',
          body: 'Cuan lets you log expenses through natural-language chat, organize them into accounts and categories, and query your own ledger. It is a record-keeping tool, not financial advice.',
        },
        {
          title: 'Your data',
          body: 'You own your data. You are responsible for the accuracy of what you log and for keeping your account credentials private.',
        },
        {
          title: 'Availability',
          body: 'The service is provided on a best-effort basis with no uptime guarantee. Export anything you cannot afford to lose.',
        },
        {
          title: 'Acceptable use',
          body: "Do not use the service for anything unlawful, and do not attempt to access another user's ledger.",
        },
        {
          title: 'Changes',
          body: 'These terms may change as the project evolves. Material changes will be noted on this page with an updated date.',
        },
      ],
    },
  },
} as const;

export type Locale = keyof typeof landingTranslations;

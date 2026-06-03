const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { pool, initDb } = require('./db');

const seed = async () => {
  try {
    try {
      const tempConn = await mysql.createConnection({
        host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
        user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
        charset: 'utf8mb4'
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || process.env.MYSQLDATABASE || 'gameguessr'}\``);
      await tempConn.end();
    } catch (err) {
      console.log('Database creation in seed skipped or handled by host provider:', err.message);
    }

    console.log('Dropping existing database tables to apply new schema...');
    const dropConn = await pool.getConnection();
    try {
      await dropConn.query('SET FOREIGN_KEY_CHECKS = 0');
      await dropConn.query('DROP TABLE IF EXISTS audit_log');
      await dropConn.query('DROP TABLE IF EXISTS quiz_sessions');
      await dropConn.query('DROP TABLE IF EXISTS scores');
      await dropConn.query('DROP TABLE IF EXISTS questions');
      await dropConn.query('DROP TABLE IF EXISTS quizzes');
      await dropConn.query('DROP TABLE IF EXISTS users');
      await dropConn.query('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
      dropConn.release();
    }

    console.log('Initializing database tables with new schema...');
    await initDb();
    console.log('Tables initialized. Starting seeding default quizzes...');

    const conn = await pool.getConnection();
    try {

      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('Admin123', salt);
      const uploaderPass = await bcrypt.hash('Upload123', salt);
      const playerPass = await bcrypt.hash('Player123', salt);

      // Seed 1. Admin
      const [adminResult] = await conn.query(
        `INSERT INTO users (username, email, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin', 'admin@gameguessr.com', adminPass, 'Administrator', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin']
      );

      // Seed 2. Uploader
      const [uploaderResult] = await conn.query(
        `INSERT INTO users (username, email, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
        ['uploader', 'uploader@gameguessr.com', uploaderPass, 'Quiz Creator', 'uploader', 'https://api.dicebear.com/7.x/avataaars/svg?seed=uploader']
      );
      const uploaderId = uploaderResult.insertId;

      // Seed 3. Player
      await conn.query(
        `INSERT INTO users (username, email, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
        ['player', 'player@gameguessr.com', playerPass, 'Pro Gamer', 'participant', 'https://api.dicebear.com/7.x/avataaars/svg?seed=player']
      );

      console.log('Dummy accounts seeded successfully!');

      // Seeding 14 Game Quizzes with 5 Questions each (Bilingual)
      const quizzesData = [
        {
          title: 'Tebak Game: Minecraft',
          title_en: 'Guess the Game: Minecraft',
          description: 'Seberapa jauh kamu memahami dunia blok sandbox terpopuler sepanjang sejarah?',
          description_en: 'How well do you know the most popular block sandbox game in history?',
          category_tags: 'Minecraft, Sandbox, Adventure',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapakah pencipta asli dari game sandbox Minecraft sebelum diakuisisi oleh Microsoft?',
              question_text_en: 'Who is the original creator of the sandbox game Minecraft before it was acquired by Microsoft?',
              image_url: '/uploads/games/minecraft.jpg',
              option_a: 'Markus Persson (Notch)',
              option_a_en: 'Markus Persson (Notch)',
              option_b: 'Jens Bergensten (Jeb)',
              option_b_en: 'Jens Bergensten (Jeb)',
              option_c: 'Gabe Newell',
              option_c_en: 'Gabe Newell',
              option_d: 'Steve Jobs',
              option_d_en: 'Steve Jobs',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama boss terakhir di Minecraft yang bersemayam di dimensi kegelapan kuno?',
              question_text_en: 'What is the name of the final boss in Minecraft residing in the ancient dark dimension?',
              image_url: '/uploads/games/minecraft.jpg',
              option_a: 'Wither',
              option_a_en: 'Wither',
              option_b: 'Ender Dragon',
              option_b_en: 'Ender Dragon',
              option_c: 'Warden',
              option_c_en: 'Warden',
              option_d: 'Herobrine',
              option_d_en: 'Herobrine',
              correct_option: 'B'
            },
            {
              question_text: 'Bahan makanan berkebun apa yang disukai babi di Minecraft untuk menjinakkan dan mengawinkan mereka?',
              question_text_en: 'What gardening food do pigs in Minecraft love to tame and breed them?',
              image_url: '/uploads/games/minecraft.jpg',
              option_a: 'Wheat (Gandum)',
              option_a_en: 'Wheat',
              option_b: 'Seeds (Biji-bijian)',
              option_b_en: 'Seeds',
              option_c: 'Carrot (Wortel)',
              option_c_en: 'Carrot',
              option_d: 'Sugar Cane (Tebu)',
              option_d_en: 'Sugar Cane',
              correct_option: 'C'
            },
            {
              question_text: 'Apa nama sayap legendaris yang dicari di kapal udara The End agar karakter pemain bisa meluncur terbang di langit?',
              question_text_en: 'What is the name of the legendary wings found in End Ships that allow players to glide in the sky?',
              image_url: '/uploads/games/minecraft.jpg',
              option_a: 'Elytra',
              option_a_en: 'Elytra',
              option_b: 'Jetpack',
              option_b_en: 'Jetpack',
              option_c: 'Angel Wings',
              option_c_en: 'Angel Wings',
              option_d: 'Glider',
              option_d_en: 'Glider',
              correct_option: 'A'
            },
            {
              question_text: 'Blok mineral mentah berwarna kemerahan apa yang berfungsi memancarkan energi listrik untuk menyalakan sirkuit mekanis?',
              question_text_en: 'What red raw mineral block emits electrical energy to power mechanical circuits?',
              image_url: '/uploads/games/minecraft.jpg',
              option_a: 'Redstone Ore',
              option_a_en: 'Redstone Ore',
              option_b: 'Lapis Lazuli',
              option_b_en: 'Lapis Lazuli',
              option_c: 'Obsidian',
              option_c_en: 'Obsidian',
              option_d: 'Glowstone',
              option_d_en: 'Glowstone',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Cyberpunk 2077',
          title_en: 'Guess the Game: Cyberpunk 2077',
          description: 'Uji pengetahuanmu tentang petualangan futuristik V di dunia distopia Night City.',
          description_en: "Test your knowledge of V's futuristic adventures in the dystopian world of Night City.",
          category_tags: 'Cyberpunk, RPG, Sci-Fi',
          time_limit: 30,
          questions: [
            {
              question_text: 'Di kota megalopolis futuristik manakah petualangan V dan Johnny Silverhand berlangsung?',
              question_text_en: 'In which futuristic megalopolis does the adventure of V and Johnny Silverhand take place?',
              image_url: '/uploads/games/cyberpunk-2077.jpg',
              option_a: 'Los Santos',
              option_a_en: 'Los Santos',
              option_b: 'Night City',
              option_b_en: 'Night City',
              option_c: 'Liberty City',
              option_c_en: 'Liberty City',
              option_d: 'Raccoon City',
              option_d_en: 'Raccoon City',
              correct_option: 'B'
            },
            {
              question_text: 'Aktor kawakan siapakah yang mengisi suara sekaligus model penampilan dari karakter Johnny Silverhand?',
              question_text_en: 'Which veteran actor provides the voice and likeness for the character Johnny Silverhand?',
              image_url: '/uploads/games/cyberpunk-2077.jpg',
              option_a: 'Keanu Reeves',
              option_a_en: 'Keanu Reeves',
              option_b: 'Brad Pitt',
              option_b_en: 'Brad Pitt',
              option_c: 'Robert Downey Jr.',
              option_c_en: 'Robert Downey Jr.',
              option_d: 'Johnny Depp',
              option_d_en: 'Johnny Depp',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama implan biochip legendaris berisi kesadaran Johnny Silverhand yang dicari V dan tertanam di kepalanya?',
              question_text_en: "What is the name of the legendary biochip implant containing Johnny Silverhand's consciousness that is slotted into V's head?",
              image_url: '/uploads/games/cyberpunk-2077.jpg',
              option_a: 'The Relic',
              option_a_en: 'The Relic',
              option_b: 'Cyberdeck',
              option_b_en: 'Cyberdeck',
              option_c: 'Sandevistan',
              option_c_en: 'Sandevistan',
              option_d: 'Mantis Blades',
              option_d_en: 'Mantis Blades',
              correct_option: 'A'
            },
            {
              question_text: 'Megakorporasi raksasa asal Jepang manakah yang mendominasi Night City dan menjadi musuh utama dalam alur cerita Cyberpunk 2077?',
              question_text_en: 'Which giant Japanese megacorporation dominates Night City and serves as the main antagonist in Cyberpunk 2077?',
              image_url: '/uploads/games/cyberpunk-2077.jpg',
              option_a: 'Militech',
              option_a_en: 'Militech',
              option_b: 'Arasaka',
              option_b_en: 'Arasaka',
              option_c: 'Kang Tao',
              option_c_en: 'Kang Tao',
              option_d: 'Weyland',
              option_d_en: 'Weyland',
              correct_option: 'B'
            },
            {
              question_text: 'Apa nama bar legendaris di distrik Watson yang menjadi tempat berkumpulnya para tentara bayaran (mercenary) kelas atas di Night City?',
              question_text_en: 'What is the name of the legendary bar in the Watson district that serves as a hangout for top-tier mercenaries in Night City?',
              image_url: '/uploads/games/cyberpunk-2077.jpg',
              option_a: 'Afterlife',
              option_a_en: 'Afterlife',
              option_b: "Lizzy's Bar",
              option_b_en: "Lizzy's Bar",
              option_c: 'The Coyote Cojo',
              option_c_en: 'The Coyote Cojo',
              option_d: 'Totentanz',
              option_d_en: 'Totentanz',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Elden Ring',
          title_en: 'Guess the Game: Elden Ring',
          description: 'Uji pemahamanmu tentang Lands Between di game peraih Game of the Year 2022 ini.',
          description_en: 'Test your understanding of the Lands Between in this 2022 Game of the Year winner.',
          category_tags: 'Elden Ring, Soulslike, RPG',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapakah penulis novel fantasi legendaris yang berkolaborasi dengan Hidetaka Miyazaki dalam worldbuilding Elden Ring?',
              question_text_en: "Who is the legendary fantasy author who collaborated with Hidetaka Miyazaki on Elden Ring's worldbuilding?",
              image_url: '/uploads/games/elden-ring.jpg',
              option_a: 'J.K. Rowling',
              option_a_en: 'J.K. Rowling',
              option_b: 'George R. R. Martin',
              option_b_en: 'George R. R. Martin',
              option_c: 'J.R.R. Tolkien',
              option_c_en: 'J.R.R. Tolkien',
              option_d: 'Brandon Sanderson',
              option_d_en: 'Brandon Sanderson',
              correct_option: 'B'
            },
            {
              question_text: 'Apa nama mata uang utama di game Elden Ring yang digunakan untuk menaikkan level karakter?',
              question_text_en: 'What is the main currency in Elden Ring used to level up character attributes?',
              image_url: '/uploads/games/elden-ring.jpg',
              option_a: 'Gold',
              option_a_en: 'Gold',
              option_b: 'Souls',
              option_b_en: 'Souls',
              option_c: 'Runes',
              option_c_en: 'Runes',
              option_d: 'Blood Echoes',
              option_d_en: 'Blood Echoes',
              correct_option: 'C'
            },
            {
              question_text: "Siapakah bos wanita legendaris berkepala merah (Goddess of Rot) yang terkenal dengan ucapan ikonik 'I am Malenia, Blade of Miquella'?",
              question_text_en: "Who is the legendary red-haired female boss (Goddess of Rot) famous for the line 'I am Malenia, Blade of Miquella'?",
              image_url: '/uploads/games/elden-ring.jpg',
              option_a: 'Malenia',
              option_a_en: 'Malenia',
              option_b: 'Ranni',
              option_b_en: 'Ranni',
              option_c: 'Marika',
              option_c_en: 'Marika',
              option_d: 'Rennala',
              option_d_en: 'Rennala',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama pohon raksasa bersinar keemasan yang mendominasi pemandangan langit di seluruh wilayah Lands Between?',
              question_text_en: 'What is the name of the giant glowing golden tree that dominates the skyline of the Lands Between?',
              image_url: '/uploads/games/elden-ring.jpg',
              option_a: 'Yggdrasil',
              option_a_en: 'Yggdrasil',
              option_b: 'Great Oak',
              option_b_en: 'Great Oak',
              option_c: 'Erdtree',
              option_c_en: 'Erdtree',
              option_d: 'Haligtree',
              option_d_en: 'Haligtree',
              correct_option: 'C'
            },
            {
              question_text: 'Siapakah karakter setengah manusia setengah serigala berpedang besar yang merupakan pelayan setia Ranni the Witch?',
              question_text_en: 'Who is the half-wolf, half-human greatsword wielder who serves as the loyal shadow of Ranni the Witch?',
              image_url: '/uploads/games/elden-ring.jpg',
              option_a: 'Blaidd',
              option_a_en: 'Blaidd',
              option_b: 'Maliketh',
              option_b_en: 'Maliketh',
              option_c: 'Radahn',
              option_c_en: 'Radahn',
              option_d: 'Godfrey',
              option_d_en: 'Godfrey',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Grand Theft Auto V',
          title_en: 'Guess the Game: Grand Theft Auto V',
          description: 'Seberapa hafal kamu dengan kehidupan kriminal Michael, Franklin, dan Trevor di Los Santos?',
          description_en: 'How well do you know the criminal lives of Michael, Franklin, and Trevor in Los Santos?',
          category_tags: 'GTA, Action, Open World',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapakah tiga karakter utama protagonis yang kita mainkan di Grand Theft Auto V?',
              question_text_en: 'Who are the three main protagonist characters we play in Grand Theft Auto V?',
              image_url: '/uploads/games/gta-v.png',
              option_a: 'CJ, Sweet, dan Big Smoke',
              option_a_en: 'CJ, Sweet, and Big Smoke',
              option_b: 'Michael, Franklin, dan Trevor',
              option_b_en: 'Michael, Franklin, and Trevor',
              option_c: 'Nico, Roman, dan Jacob',
              option_c_en: 'Nico, Roman, and Jacob',
              option_d: 'Tommy, Ken, dan Lance',
              option_d_en: 'Tommy, Ken, and Lance',
              correct_option: 'B'
            },
            {
              question_text: 'Apa nama kota utama fiktif tempat berlangsungnya alur cerita di GTA V?',
              question_text_en: 'What is the name of the main fictional city where the storyline of GTA V takes place?',
              image_url: '/uploads/games/gta-v.png',
              option_a: 'Vice City',
              option_a_en: 'Vice City',
              option_b: 'Liberty City',
              option_b_en: 'Liberty City',
              option_c: 'Los Santos',
              option_c_en: 'Los Santos',
              option_d: 'San Fierro',
              option_d_en: 'San Fierro',
              correct_option: 'C'
            },
            {
              question_text: 'Siapakah nama karakter anjing ras Rottweiler milik Franklin Clinton yang bisa diajak berjalan-jalan dan menyerang musuh?',
              question_text_en: "What is the name of Franklin Clinton's Rottweiler dog who can go for walks and attack enemies?",
              image_url: '/uploads/games/gta-v.png',
              option_a: 'Chop',
              option_a_en: 'Chop',
              option_b: 'Lamar',
              option_b_en: 'Lamar',
              option_c: 'Riley',
              option_c_en: 'Riley',
              option_d: 'Buster',
              option_d_en: 'Buster',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama perusahaan keamanan militer swasta (PMC) korup dalam game yang memburu ketiga karakter utama kita?',
              question_text_en: 'What is the name of the corrupt private military company (PMC) that hunts our three main characters?',
              image_url: '/uploads/games/gta-v.png',
              option_a: 'Merryweather Security',
              option_a_en: 'Merryweather Security',
              option_b: 'Blackwater',
              option_b_en: 'Blackwater',
              option_c: 'Gruppe Sechs',
              option_c_en: 'Gruppe Sechs',
              option_d: 'FIB',
              option_d_en: 'FIB',
              correct_option: 'A'
            },
            {
              question_text: 'Di daerah pedesaan gurun terpencil manakah tempat tinggal awal Trevor Philips sebelum ia pergi ke Los Santos?',
              question_text_en: 'In which desert countryside region does Trevor Philips live before moving to Los Santos?',
              image_url: '/uploads/games/gta-v.png',
              option_a: 'Sandy Shores',
              option_a_en: 'Sandy Shores',
              option_b: 'Paleto Bay',
              option_b_en: 'Paleto Bay',
              option_c: 'Grapeseed',
              option_c_en: 'Grapeseed',
              option_d: 'Mount Chiliad',
              option_d_en: 'Mount Chiliad',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Hollow Knight',
          title_en: 'Guess the Game: Hollow Knight',
          description: 'Jelajahi kembali kerajaan serangga bawah tanah Hallownest yang misterius.',
          description_en: 'Explore the mysterious underground insect kingdom of Hallownest.',
          category_tags: 'Hollow Knight, Metroidvania, Indie',
          time_limit: 30,
          questions: [
            {
              question_text: 'Di kerajaan bawah tanah kuno manakah petualangan Hollow Knight berlangsung?',
              question_text_en: 'In which ancient underground kingdom does the adventure of Hollow Knight take place?',
              image_url: '/uploads/games/hollow-knight.png',
              option_a: 'Lordran',
              option_a_en: 'Lordran',
              option_b: 'Hallownest',
              option_b_en: 'Hallownest',
              option_c: 'Hyrule',
              option_c_en: 'Hyrule',
              option_d: 'Zebes',
              option_d_en: 'Zebes',
              correct_option: 'B'
            },
            {
              question_text: 'Apa nama mata uang utama yang digunakan di dalam game Hollow Knight?',
              question_text_en: 'What is the name of the main currency used in Hollow Knight?',
              image_url: '/uploads/games/hollow-knight.png',
              option_a: 'Gold',
              option_a_en: 'Gold',
              option_b: 'Geo',
              option_b_en: 'Geo',
              option_c: 'Souls',
              option_c_en: 'Souls',
              option_d: 'Rupee',
              option_d_en: 'Rupee',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah bos wanita lincah pelindung reruntuhan kerajaan kuno yang menggunakan jarum dan benang sutra sebagai senjatanya?',
              question_text_en: 'Who is the agile female boss protecting the ancient ruins who uses a needle and thread as her weapon?',
              image_url: '/uploads/games/hollow-knight.png',
              option_a: 'Hornet',
              option_a_en: 'Hornet',
              option_b: 'Sly',
              option_b_en: 'Sly',
              option_c: 'Zote',
              option_c_en: 'Zote',
              option_d: 'Quirrel',
              option_d_en: 'Quirrel',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama skill pergerakan udara horizontal pertama yang didapatkan pemain di Greenpath?',
              question_text_en: 'What is the name of the first horizontal air movement skill obtained by the player in Greenpath?',
              image_url: '/uploads/games/hollow-knight.png',
              option_a: 'Monarch Wings',
              option_a_en: 'Monarch Wings',
              option_b: 'Mothwing Cloak',
              option_b_en: 'Mothwing Cloak',
              option_c: 'Mantis Claw',
              option_c_en: 'Mantis Claw',
              option_d: 'Crystal Heart',
              option_d_en: 'Crystal Heart',
              correct_option: 'B'
            },
            {
              question_text: 'Di area bawah tanah gelap manakah letak sarang kawanan laba-laba dan tempat peristirahatan salah satu Dreamer, Herrah the Beast?',
              question_text_en: 'In which dark underground area is the nest of spiders located, hosting the resting place of Herrah the Beast?',
              image_url: '/uploads/games/hollow-knight.png',
              option_a: 'Deepnest',
              option_a_en: 'Deepnest',
              option_b: 'Crystal Peak',
              option_b_en: 'Crystal Peak',
              option_c: 'Ancient Basin',
              option_c_en: 'Ancient Basin',
              option_d: 'Royal Waterways',
              option_d_en: 'Royal Waterways',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Red Dead Redemption 2',
          title_en: 'Guess the Game: Red Dead Redemption 2',
          description: 'Kuis seputar petualangan coboy epik bersama geng kriminal Van der Linde.',
          description_en: 'A quiz about the epic cowboy adventure with the Van der Linde gang.',
          category_tags: 'RDR2, Open World, Western',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapakah nama karakter utama protagonis yang kita mainkan di Red Dead Redemption 2?',
              question_text_en: 'Who is the main protagonist character we play as in Red Dead Redemption 2?',
              image_url: '/uploads/games/rdr2.png',
              option_a: 'John Marston',
              option_a_en: 'John Marston',
              option_b: 'Arthur Morgan',
              option_b_en: 'Arthur Morgan',
              option_c: 'Dutch van der Linde',
              option_c_en: 'Dutch van der Linde',
              option_d: 'Micah Bell',
              option_d_en: 'Micah Bell',
              correct_option: 'B'
            },
            {
              question_text: 'Apa nama geng kriminal legendaris tempat Arthur Morgan bernaung?',
              question_text_en: 'What is the name of the legendary outlaw gang that Arthur Morgan belongs to?',
              image_url: '/uploads/games/rdr2.png',
              option_a: "O'Driscoll Gang",
              option_a_en: "O'Driscoll Gang",
              option_b: 'Van der Linde Gang',
              option_b_en: 'Van der Linde Gang',
              option_c: 'Grove Street Families',
              option_c_en: 'Grove Street Families',
              option_d: 'Pinkerton Agency',
              option_d_en: 'Pinkerton Agency',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah nama anak laki-laki kecil dari John Marston dan Abigail yang diculik dan harus diselamatkan dari Saint Denis?',
              question_text_en: "What is the name of John Marston and Abigail's young son who is kidnapped and rescued from Saint Denis?",
              image_url: '/uploads/games/rdr2.png',
              option_a: 'Jack Marston',
              option_a_en: 'Jack Marston',
              option_b: 'Sean MacGuire',
              option_b_en: 'Sean MacGuire',
              option_c: 'Lenny Summers',
              option_c_en: 'Lenny Summers',
              option_d: 'Kieran Duffy',
              option_d_en: 'Kieran Duffy',
              correct_option: 'A'
            },
            {
              question_text: 'Kota industri modern berpolusi tinggi manakah yang menjadi kota terbesar di seluruh peta wilayah RDR2?',
              question_text_en: 'Which highly polluted modern industrial city is the largest city on the RDR2 map?',
              image_url: '/uploads/games/rdr2.png',
              option_a: 'Valentine',
              option_a_en: 'Valentine',
              option_b: 'Saint Denis',
              option_b_en: 'Saint Denis',
              option_c: 'Rhodes',
              option_c_en: 'Rhodes',
              option_d: 'Blackwater',
              option_d_en: 'Blackwater',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah anggota pengkhianat utama di dalam geng Van der Linde yang menjadi dalang kehancuran Arthur Morgan?',
              question_text_en: "Who is the main traitor within the Van der Linde gang who orchestrates Arthur Morgan's downfall?",
              image_url: '/uploads/games/rdr2.png',
              option_a: 'Micah Bell',
              option_a_en: 'Micah Bell',
              option_b: 'Hosea Matthews',
              option_b_en: 'Hosea Matthews',
              option_c: 'Charles Smith',
              option_c_en: 'Charles Smith',
              option_d: 'Bill Williamson',
              option_d_en: 'Bill Williamson',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Stardew Valley',
          title_en: 'Guess the Game: Stardew Valley',
          description: 'Uji pengetahuan perkebunanmu tentang kehidupan santai di Pelican Town.',
          description_en: 'Test your farming knowledge of the relaxing life in Pelican Town.',
          category_tags: 'Stardew Valley, Cozy, Simulation',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapakah nama developer tunggal yang mengembangkan game Stardew Valley secara mandiri?',
              question_text_en: 'What is the name of the solo developer who created Stardew Valley independently?',
              image_url: '/uploads/games/stardew-valley.png',
              option_a: 'ConcernedApe (Eric Barone)',
              option_a_en: 'ConcernedApe (Eric Barone)',
              option_b: 'Notch',
              option_b_en: 'Notch',
              option_c: 'Toby Fox',
              option_c_en: 'Toby Fox',
              option_d: 'Scott Cawthon',
              option_d_en: 'Scott Cawthon',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama kota utama tempat perkebunan kakekmu berada di Stardew Valley?',
              question_text_en: "What is the name of the main town where your grandfather's farm is located in Stardew Valley?",
              image_url: '/uploads/games/stardew-valley.png',
              option_a: 'Pelican Town',
              option_a_en: 'Pelican Town',
              option_b: 'Zuzu City',
              option_b_en: 'Zuzu City',
              option_c: 'Pallet Town',
              option_c_en: 'Pallet Town',
              option_d: 'Riverwood',
              option_d_en: 'Riverwood',
              correct_option: 'A'
            },
            {
              question_text: 'Siapa nama walikota Pelican Town berkumis dan bertopi cokelat yang sering memintamu mencari celana pendek ungu kesayangannya?',
              question_text_en: "What is the name of Pelican Town's mustached mayor who often asks you to find his lucky purple shorts?",
              image_url: '/uploads/games/stardew-valley.png',
              option_a: 'Lewis',
              option_a_en: 'Lewis',
              option_b: 'Pierre',
              option_b_en: 'Pierre',
              option_c: 'Clint',
              option_c_en: 'Clint',
              option_d: 'Gunther',
              option_d_en: 'Gunther',
              correct_option: 'A'
            },
            {
              question_text: 'Makhluk roh pelindung hutan ramah apa yang tinggal di Community Center dan membantumu merestorasi kota?',
              question_text_en: 'What friendly forest spirits live in the Community Center and help you restore the town?',
              image_url: '/uploads/games/stardew-valley.png',
              option_a: 'Junimos',
              option_a_en: 'Junimos',
              option_b: 'Dwarves',
              option_b_en: 'Dwarves',
              option_c: 'Shadow Shaman',
              option_c_en: 'Shadow Shaman',
              option_d: 'Krobus',
              option_d_en: 'Krobus',
              correct_option: 'A'
            },
            {
              question_text: 'Di musim apakah tanaman berharga tinggi seperti Pumpkin (Labu), Cranberry, dan Grapes dapat Anda tanam?',
              question_text_en: 'In which season can high-value crops like Pumpkins, Cranberries, and Grapes be grown?',
              image_url: '/uploads/games/stardew-valley.png',
              option_a: 'Spring (Musim Semi)',
              option_a_en: 'Spring',
              option_b: 'Summer (Musim Panas)',
              option_b_en: 'Summer',
              option_c: 'Fall (Musim Gugur)',
              option_c_en: 'Fall',
              option_d: 'Winter (Musim Dingin)',
              option_d_en: 'Winter',
              correct_option: 'C'
            }
          ]
        },
        {
          title: 'Tebak Game: Super Mario',
          title_en: 'Guess the Game: Super Mario',
          description: 'Kuis klasik seputar tukang ledeng legendaris Mario dan kawan-kawan.',
          description_en: 'A classic quiz about the legendary plumber Mario and friends.',
          category_tags: 'Mario, Platformer, Nintendo',
          time_limit: 30,
          questions: [
            {
              question_text: 'Karakter ikonik Mario pertama kali muncul di game arcade klasik tahun 1981 yang mana?',
              question_text_en: 'In which classic 1981 arcade game did the iconic character Mario first appear?',
              image_url: '/uploads/games/super-mario.jpg',
              option_a: 'Super Mario Bros',
              option_a_en: 'Super Mario Bros',
              option_b: 'Donkey Kong',
              option_b_en: 'Donkey Kong',
              option_c: 'Pac-Man',
              option_c_en: 'Pac-Man',
              option_d: 'Jumpman',
              option_d_en: 'Jumpman',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah musuh bebuyutan utama Mario yang berkali-kali menculik Princess Peach?',
              question_text_en: "Who is Mario's arch-nemesis who repeatedly kidnaps Princess Peach?",
              image_url: '/uploads/games/super-mario.jpg',
              option_a: 'Bowser',
              option_a_en: 'Bowser',
              option_b: 'Luigi',
              option_b_en: 'Luigi',
              option_c: 'Wario',
              option_c_en: 'Wario',
              option_d: 'Donkey Kong',
              option_d_en: 'Donkey Kong',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama kerajaan fiktif tempat tinggal jamur Toad dan Princess Peach yang selalu dilindungi oleh Mario?',
              question_text_en: 'What is the name of the fictional kingdom home to Toads and Princess Peach protected by Mario?',
              image_url: '/uploads/games/super-mario.jpg',
              option_a: 'Mushroom Kingdom',
              option_a_en: 'Mushroom Kingdom',
              option_b: 'Hyrule',
              option_b_en: 'Hyrule',
              option_c: 'Dream Land',
              option_c_en: 'Dream Land',
              option_d: "Bowser's Castle",
              option_d_en: "Bowser's Castle",
              correct_option: 'A'
            },
            {
              question_text: "Item jamur berwarna hijau dengan tulisan '1-Up' memberikan efek apa bagi Mario saat dikonsumsi?",
              question_text_en: "What effect does the green mushroom item with '1-Up' written on it give to Mario when consumed?",
              image_url: '/uploads/games/super-mario.jpg',
              option_a: 'Nyawa Tambahan (Extra Life)',
              option_a_en: 'Extra Life',
              option_b: 'Menjadi Raksasa (Super Size)',
              option_b_en: 'Super Size',
              option_c: 'Tembakan Api (Fire Ball)',
              option_c_en: 'Fire Ball',
              option_d: 'Kebal Sementara (Invincibility)',
              option_d_en: 'Invincibility',
              correct_option: 'A'
            },
            {
              question_text: 'Siapa nama dinosaurus kecil berwarna hijau yang menjadi tunggangan setia Mario dan bisa memakan musuh?',
              question_text_en: "What is the name of the small green dinosaur who serves as Mario's loyal mount and can eat enemies?",
              image_url: '/uploads/games/super-mario.jpg',
              option_a: 'Yoshi',
              option_a_en: 'Yoshi',
              option_b: 'Bowser Jr.',
              option_b_en: 'Bowser Jr.',
              option_c: 'Toadette',
              option_c_en: 'Toadette',
              option_d: 'Wiggler',
              option_d_en: 'Wiggler',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: The Witcher 3',
          title_en: 'Guess the Game: The Witcher 3',
          description: 'Uji ingatanmu mengenai petualangan berburu monster bersama Geralt of Rivia.',
          description_en: 'Test your memory of monster hunting adventures with Geralt of Rivia.',
          category_tags: 'Witcher, RPG, Fantasy',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapakah nama pemburu monster (Witcher) legendaris yang menjadi karakter utama di game ini?',
              question_text_en: 'What is the name of the legendary monster hunter (Witcher) who is the main character of this game?',
              image_url: '/uploads/games/witcher-3.png',
              option_a: 'Geralt of Rivia',
              option_a_en: 'Geralt of Rivia',
              option_b: 'Yennefer of Vengerberg',
              option_b_en: 'Yennefer of Vengerberg',
              option_c: 'Ciri of Cintra',
              option_c_en: 'Ciri of Cintra',
              option_d: 'Vesemir',
              option_d_en: 'Vesemir',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama kastil/sekolah pelatihan Witcher tempat Geralt dibesarkan dan dididik?',
              question_text_en: 'What is the name of the Witcher keep/training school where Geralt was raised and trained?',
              image_url: '/uploads/games/witcher-3.png',
              option_a: 'Kaer Morhen',
              option_a_en: 'Kaer Morhen',
              option_b: 'Novigrad',
              option_b_en: 'Novigrad',
              option_c: 'Wyzima',
              option_c_en: 'Wyzima',
              option_d: 'Skellige',
              option_d_en: 'Skellige',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama pasukan ksatria hantu gaib dari dimensi es lain yang memburu anak angkat Geralt, Ciri, sepanjang cerita?',
              question_text_en: "What is the name of the spectral army from another dimension that hunts Geralt's adopted daughter, Ciri, throughout the story?",
              image_url: '/uploads/games/witcher-3.png',
              option_a: 'The Wild Hunt',
              option_a_en: 'The Wild Hunt',
              option_b: 'Nilfgaard Empire',
              option_b_en: 'Nilfgaard Empire',
              option_c: "Scoia'tael",
              option_c_en: "Scoia'tael",
              option_d: 'Order of the Flaming Rose',
              option_d_en: 'Order of the Flaming Rose',
              correct_option: 'A'
            },
            {
              question_text: 'Siapakah penyihir wanita berambut hitam legam beraroma lilac dan gooseberry yang merupakan cinta sejati Geralt?',
              question_text_en: "Who is the black-haired sorceress smelling of lilac and gooseberries who is Geralt's true love?",
              image_url: '/uploads/games/witcher-3.png',
              option_a: 'Yennefer of Vengerberg',
              option_a_en: 'Yennefer of Vengerberg',
              option_b: 'Triss Merigold',
              option_b_en: 'Triss Merigold',
              option_c: 'Keira Metz',
              option_c_en: 'Keira Metz',
              option_d: 'Philippa Eilhart',
              option_d_en: 'Philippa Eilhart',
              correct_option: 'A'
            },
            {
              question_text: 'Mantra sihir Witcher (Sign) jenis apakah yang digunakan Geralt untuk menghasilkan semburan api pembakar musuh?',
              question_text_en: 'Which Witcher magic spell (Sign) is used by Geralt to produce a burst of fire to burn enemies?',
              image_url: '/uploads/games/witcher-3.png',
              option_a: 'Igni',
              option_a_en: 'Igni',
              option_b: 'Aard',
              option_b_en: 'Aard',
              option_c: 'Quen',
              option_c_en: 'Quen',
              option_d: 'Axii',
              option_d_en: 'Axii',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Zelda BotW',
          title_en: 'Guess the Game: Zelda BotW',
          description: 'Uji pengetahuanmu tentang petualangan epik Link di dunia reruntuhan Hyrule.',
          description_en: "Test your knowledge of Link's epic adventure in the ruined world of Hyrule.",
          category_tags: 'Zelda, Action-Adventure, Nintendo',
          time_limit: 30,
          questions: [
            {
              question_text: 'Apa nama kerajaan luas yang harus diselamatkan oleh Link dari ancaman Calamity Ganon?',
              question_text_en: 'What is the name of the vast kingdom that Link must save from Calamity Ganon?',
              image_url: '/uploads/games/zelda-botw.png',
              option_a: 'Hyrule',
              option_a_en: 'Hyrule',
              option_b: 'Lorule',
              option_b_en: 'Lorule',
              option_c: 'Termina',
              option_c_en: 'Termina',
              option_d: 'Skyloft',
              option_d_en: 'Skyloft',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama alat multifungsi berbentuk tablet kuno yang digunakan Link untuk mengakses peta dan rune sihir?',
              question_text_en: 'What is the name of the multi-functional tablet tool used by Link to access maps and runes?',
              image_url: '/uploads/games/zelda-botw.png',
              option_a: 'Sheikah Slate',
              option_a_en: 'Sheikah Slate',
              option_b: 'Ocarina of Time',
              option_b_en: 'Ocarina of Time',
              option_c: 'Sailcloth',
              option_c_en: 'Sailcloth',
              option_d: 'Triforce',
              option_d_en: 'Triforce',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama pedang legendaris penumpas kegelapan (Sword that Seals the Darkness) yang dijaga oleh Great Deku Tree?',
              question_text_en: 'What is the name of the legendary sword that seals the darkness, guarded by the Great Deku Tree?',
              image_url: '/uploads/games/zelda-botw.png',
              option_a: 'Master Sword',
              option_a_en: 'Master Sword',
              option_b: 'Hylian Blade',
              option_b_en: 'Hylian Blade',
              option_c: 'Goddess Sword',
              option_c_en: 'Goddess Sword',
              option_d: "Giant's Knife",
              option_d_en: "Giant's Knife",
              correct_option: 'A'
            },
            {
              question_text: 'Siapakah nama Juara (Champion) dari ras Zora air yang memiliki perasaan pada Link dan mengendalikan Divine Beast Vah Ruta?',
              question_text_en: 'Who is the Zora Champion who has feelings for Link and controls the Divine Beast Vah Ruta?',
              image_url: '/uploads/games/zelda-botw.png',
              option_a: 'Mipha',
              option_a_en: 'Mipha',
              option_b: 'Urbosa',
              option_b_en: 'Urbosa',
              option_c: 'Revali',
              option_c_en: 'Revali',
              option_d: 'Daruk',
              option_d_en: 'Daruk',
              correct_option: 'A'
            },
            {
              question_text: 'Makhluk roh pelindung hutan kecil bertopeng daun apakah yang memberikan biji (seed) untuk memperluas ruang tas senjata Link?',
              question_text_en: 'What small forest spirits wearing leaf masks give seeds to expand Link\'s inventory slots?',
              image_url: '/uploads/games/zelda-botw.png',
              option_a: 'Korok',
              option_a_en: 'Korok',
              option_b: 'Kokiri',
              option_b_en: 'Kokiri',
              option_c: 'Skull Kid',
              option_c_en: 'Skull Kid',
              option_d: 'Bokoblin',
              option_d_en: 'Bokoblin',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Valorant',
          title_en: 'Guess the Game: Valorant',
          description: 'Uji kemampuan taktikal dan pengetahuanmu seputar agen dan senjata di game shooter Valorant.',
          description_en: 'Test your tactical skills and knowledge of agents and weapons in the shooter Valorant.',
          category_tags: 'Valorant, FPS, Shooter',
          time_limit: 30,
          questions: [
            {
              question_text: 'Agen duelist manakah yang berasal dari Korea Selatan dan memiliki kelincahan meluncur di udara serta memanggil pisau terbang (Blade Storm)?',
              question_text_en: 'Which duelist agent comes from South Korea, excels at gliding through the air, and summons flying daggers (Blade Storm)?',
              image_url: '/uploads/games/valorant.jpg',
              option_a: 'Jett',
              option_a_en: 'Jett',
              option_b: 'Sage',
              option_b_en: 'Sage',
              option_c: 'Reyna',
              option_c_en: 'Reyna',
              option_d: 'Phoenix',
              option_d_en: 'Phoenix',
              correct_option: 'A'
            },
            {
              question_text: 'Senjata laras panjang (Rifle) termahal manakah yang paling populer karena memiliki damage mematikan satu kali tembak di kepala (one-tap headshot)?',
              question_text_en: 'Which expensive rifle is the most popular because of its one-tap headshot capability?',
              image_url: '/uploads/games/valorant.jpg',
              option_a: 'Phantom',
              option_a_en: 'Phantom',
              option_b: 'Vandal',
              option_b_en: 'Vandal',
              option_c: 'Spectre',
              option_c_en: 'Spectre',
              option_d: 'Operator',
              option_d_en: 'Operator',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah nama agen Sentinel asal Tiongkok yang memiliki kemampuan untuk menyembuhkan rekan tim serta menghidupkan kembali rekan yang mati?',
              question_text_en: 'Who is the Chinese Sentinel agent capable of healing teammates and resurrecting the dead?',
              image_url: '/uploads/games/valorant.jpg',
              option_a: 'Cypher',
              option_a_en: 'Cypher',
              option_b: 'Sage',
              option_b_en: 'Sage',
              option_c: 'Killjoy',
              option_c_en: 'Killjoy',
              option_d: 'Chamber',
              option_d_en: 'Chamber',
              correct_option: 'B'
            },
            {
              question_text: 'Siapa nama agen Sentinel asal Jerman dengan kepribadian jenius yang mengandalkan robot peledak Boom Bot serta Turret tembak otomatis?',
              question_text_en: 'Who is the genius German Sentinel agent who uses robot Boom Bots and automatic sentry Turrets?',
              image_url: '/uploads/games/valorant.jpg',
              option_a: 'Raze',
              option_a_en: 'Raze',
              option_b: 'Killjoy',
              option_b_en: 'Killjoy',
              option_c: 'Neon',
              option_c_en: 'Neon',
              option_d: 'Fade',
              option_d_en: 'Fade',
              correct_option: 'B'
            },
            {
              question_text: 'Senjata Sniper termahal manakah di game Valorant yang mampu melumpuhkan musuh secara instan dengan satu tembakan di badan (one-shot body shot)?',
              question_text_en: 'Which expensive sniper rifle in Valorant can eliminate enemies with a single shot to the body?',
              image_url: '/uploads/games/valorant.jpg',
              option_a: 'Marshal',
              option_a_en: 'Marshal',
              option_b: 'Outlaw',
              option_b_en: 'Outlaw',
              option_c: 'Operator',
              option_c_en: 'Operator',
              option_d: 'Sheriff',
              option_d_en: 'Sheriff',
              correct_option: 'C'
            }
          ]
        },
        {
          title: 'Tebak Game: Mobile Legends',
          title_en: 'Guess the Game: Mobile Legends',
          description: 'Uji pengetahuanmu tentang hero, item, dan taktik pertempuran di Land of Dawn.',
          description_en: 'Test your knowledge of heroes, items, and battle tactics in the Land of Dawn.',
          category_tags: 'Mobile Legends, MOBA, Strategy',
          time_limit: 30,
          questions: [
            {
              question_text: 'Hero Assassin manakah yang bertarung dengan sangat lincah memanfaatkan kabel baja untuk bergerak cepat dari dinding ke dinding di Land of Dawn?',
              question_text_en: 'Which Assassin hero is highly mobile and uses steel cables to swing from wall to wall in the Land of Dawn?',
              image_url: '/uploads/games/mobile-legends.jpg',
              option_a: 'Gusion',
              option_a_en: 'Gusion',
              option_b: 'Fanny',
              option_b_en: 'Fanny',
              option_c: 'Ling',
              option_c_en: 'Ling',
              option_d: 'Lancelot',
              option_d_en: 'Lancelot',
              correct_option: 'B'
            },
            {
              question_text: 'Item pertahanan (Defense) manakah yang memiliki kemampuan pasif unik menghidupkan kembali hero setelah mati dengan sedikit HP?',
              question_text_en: 'Which defense item has a unique passive ability to resurrect the hero after death with a small amount of HP?',
              image_url: '/uploads/games/mobile-legends.jpg',
              option_a: "Athena's Shield",
              option_a_en: "Athena's Shield",
              option_b: 'Antique Cuirass',
              option_b_en: 'Antique Cuirass',
              option_c: 'Immortality',
              option_c_en: 'Immortality',
              option_d: 'Guardian Helmet',
              option_d_en: 'Guardian Helmet',
              correct_option: 'C'
            },
            {
              question_text: 'Monster hutan (jungle monster) terkuat manakah yang jika berhasil dikalahkan akan membantu tim menyerang turret musuh?',
              question_text_en: 'Which strongest jungle monster helps your team attack enemy turrets when defeated?',
              image_url: '/uploads/games/mobile-legends.jpg',
              option_a: 'Lord',
              option_a_en: 'Lord',
              option_b: 'Turtle',
              option_b_en: 'Turtle',
              option_c: 'Lithowanderer',
              option_c_en: 'Lithowanderer',
              option_d: 'Scavenger Crab',
              option_d_en: 'Scavenger Crab',
              correct_option: 'A'
            },
            {
              question_text: 'Siapa nama Hero Mage pawung legendaris asal Jepang di Mobile Legends yang sangat lincah berpindah-pindah posisi menggunakan payungnya?',
              question_text_en: 'Who is the legendary Japanese Mage hero in Mobile Legends who is highly mobile using her umbrella?',
              image_url: '/uploads/games/mobile-legends.jpg',
              option_a: 'Kagura',
              option_a_en: 'Kagura',
              option_b: 'Odette',
              option_b_en: 'Odette',
              option_c: 'Aurora',
              option_c_en: 'Aurora',
              option_d: 'Alice',
              option_d_en: 'Alice',
              correct_option: 'A'
            },
            {
              question_text: 'Apa nama spell pertempuran (battle spell) wajib yang harus dibawa oleh seorang Jungler agar bisa membeli item khusus jungler dan mengamankan Lord?',
              question_text_en: 'What mandatory battle spell must a Jungler carry to buy jungler items and secure the Lord?',
              image_url: '/uploads/games/mobile-legends.jpg',
              option_a: 'Flicker',
              option_a_en: 'Flicker',
              option_b: 'Execute',
              option_b_en: 'Execute',
              option_c: 'Retribution',
              option_c_en: 'Retribution',
              option_d: 'Purify',
              option_d_en: 'Purify',
              correct_option: 'C'
            }
          ]
        },
        {
          title: 'Tebak Game: Genshin Impact',
          title_en: 'Guess the Game: Genshin Impact',
          description: 'Seberapa dalam pengetahuanmu tentang benua Teyvat, Archon, dan reaksi elemental?',
          description_en: 'How deep is your knowledge of the continent of Teyvat, Archons, and elemental reactions?',
          category_tags: 'Genshin Impact, RPG, Open World',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapakah nama Archon Geo yang juga dikenal sebagai Morax dan menjalani kehidupan rahasia sebagai konsultan di Wangsheng Funeral Parlor?',
              question_text_en: 'Who is the Geo Archon, also known as Morax, living in secret as a consultant for Wangsheng Funeral Parlor?',
              image_url: '/uploads/games/genshin-impact.jpg',
              option_a: 'Zhongli',
              option_a_en: 'Zhongli',
              option_b: 'Venti',
              option_b_en: 'Venti',
              option_c: 'Raiden Shogun',
              option_c_en: 'Raiden Shogun',
              option_d: 'Neuvillette',
              option_d_en: 'Neuvillette',
              correct_option: 'A'
            },
            {
              question_text: 'Di wilayah/negara manakah Traveler memulai awal mula petualangan pertamanya di benua Teyvat dan bertemu dengan Amber?',
              question_text_en: 'In which region does the Traveler begin their first adventure in Teyvat and meet Amber?',
              image_url: '/uploads/games/genshin-impact.jpg',
              option_a: 'Liyue',
              option_a_en: 'Liyue',
              option_b: 'Mondstadt',
              option_b_en: 'Mondstadt',
              option_c: 'Inazuma',
              option_c_en: 'Inazuma',
              option_d: 'Sumeru',
              option_d_en: 'Sumeru',
              correct_option: 'B'
            },
            {
              question_text: 'Siapa nama maskot pendamping setia Traveler yang seringkali bercanda disebut sebagai Makanan Darurat (Emergency Food)?',
              question_text_en: "Who is the Traveler's companion mascot, often jokingly referred to as Emergency Food?",
              image_url: '/uploads/games/genshin-impact.jpg',
              option_a: 'Paimon',
              option_a_en: 'Paimon',
              option_b: 'Amber',
              option_b_en: 'Amber',
              option_c: 'Klee',
              option_c_en: 'Klee',
              option_d: 'Furina',
              option_d_en: 'Furina',
              correct_option: 'A'
            },
            {
              question_text: 'Reaksi elemen (Elemental Reaction) apa yang dihasilkan ketika menggabungkan elemen Dendro (tanaman/kayu) dengan elemen Electro (listrik)?',
              question_text_en: 'What elemental reaction is produced by combining Dendro and Electro?',
              image_url: '/uploads/games/genshin-impact.jpg',
              option_a: 'Vaporize',
              option_a_en: 'Vaporize',
              option_b: 'Quicken (Catalyze)',
              option_b_en: 'Quicken (Catalyze)',
              option_c: 'Melt',
              option_c_en: 'Melt',
              option_d: 'Freeze',
              option_d_en: 'Freeze',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah nama Archon Pyro (Dewa Api) pelindung wilayah perang Natlan yang memiliki wujud bertarung berambut api?',
              question_text_en: 'Who is the Pyro Archon protecting the war nation of Natlan, having a combat form with flaming hair?',
              image_url: '/uploads/games/genshin-impact.jpg',
              option_a: 'Mavuika',
              option_a_en: 'Mavuika',
              option_b: 'Murata',
              option_b_en: 'Murata',
              option_c: 'Bennett',
              option_c_en: 'Bennett',
              option_d: 'Diluc',
              option_d_en: 'Diluc',
              correct_option: 'A'
            }
          ]
        },
        {
          title: 'Tebak Game: Resident Evil 4',
          title_en: 'Guess the Game: Resident Evil 4',
          description: 'Uji keberanian dan memorimu dalam misi penyelamatan Leon S. Kennedy di desa terinfeksi Las Plagas.',
          description_en: "Test your courage and memory of Leon S. Kennedy's rescue mission in the infected Las Plagas village.",
          category_tags: 'Resident Evil 4, Horror, Action',
          time_limit: 30,
          questions: [
            {
              question_text: 'Siapa nama agen rahasia pemerintah Amerika Serikat yang dikirim ke desa terpencil Spanyol untuk menyelamatkan putri Presiden?',
              question_text_en: "Who is the US government secret agent sent to a remote Spanish village to rescue the President's daughter?",
              image_url: '/uploads/games/resident-evil-4.jpg',
              option_a: 'Chris Redfield',
              option_a_en: 'Chris Redfield',
              option_b: 'Leon S. Kennedy',
              option_b_en: 'Leon S. Kennedy',
              option_c: 'Albert Wesker',
              option_c_en: 'Albert Wesker',
              option_d: 'Ethan Winters',
              option_d_en: 'Ethan Winters',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah nama putri Presiden Amerika Serikat yang diculik oleh sekte sesat Los Illuminados dalam Resident Evil 4?',
              question_text_en: "Who is the US President's daughter kidnapped by the Los Illuminados cult in Resident Evil 4?",
              image_url: '/uploads/games/resident-evil-4.jpg',
              option_a: 'Ashley Graham',
              option_a_en: 'Ashley Graham',
              option_b: 'Ada Wong',
              option_b_en: 'Ada Wong',
              option_c: 'Claire Redfield',
              option_c_en: 'Claire Redfield',
              option_d: 'Sherry Birkin',
              option_d_en: 'Sherry Birkin',
              correct_option: 'A'
            },
            {
              question_text: 'Parasit kuno pengendali pikiran jenis apakah yang menginfeksi penduduk desa (Ganados) dalam cerita Resident Evil 4?',
              question_text_en: 'Which mind-controlling parasite infects the villagers (Ganados) in Resident Evil 4?',
              image_url: '/uploads/games/resident-evil-4.jpg',
              option_a: 'T-Virus',
              option_a_en: 'T-Virus',
              option_b: 'Las Plagas',
              option_b_en: 'Las Plagas',
              option_c: 'G-Virus',
              option_c_en: 'G-Virus',
              option_d: 'Uroboros',
              option_d_en: 'Uroboros',
              correct_option: 'B'
            },
            {
              question_text: 'Siapakah nama wanita mata-mata bergaun merah yang memegang sampel virus dan diam-diam membantu Leon dari balik bayang-bayang?',
              question_text_en: 'Who is the mysterious spy in a red dress carrying a virus sample who secretly helps Leon from the shadows?',
              image_url: '/uploads/games/resident-evil-4.jpg',
              option_a: 'Ada Wong',
              option_a_en: 'Ada Wong',
              option_b: 'Jill Valentine',
              option_b_en: 'Jill Valentine',
              option_c: 'Rebecca Chambers',
              option_c_en: 'Rebecca Chambers',
              option_d: 'Claire Redfield',
              option_d_en: 'Claire Redfield',
              correct_option: 'A'
            },
            {
              question_text: 'Senjata penghancur sekali pakai berharga mahal apakah yang sangat ampuh mengalahkan bos tersulit dengan satu kali tembakan?',
              question_text_en: 'Which expensive single-use destructive weapon is extremely effective at defeating bosses with one hit?',
              image_url: '/uploads/games/resident-evil-4.jpg',
              option_a: 'Shotgun',
              option_a_en: 'Shotgun',
              option_b: 'Rocket Launcher',
              option_b_en: 'Rocket Launcher',
              option_c: 'Magnum',
              option_c_en: 'Magnum',
              option_d: 'Red9',
              option_d_en: 'Red9',
              correct_option: 'B'
            }
          ]
        }
      ];

      for (const qData of quizzesData) {
        const [quizResult] = await conn.query(
          `INSERT INTO quizzes (title, title_en, description, description_en, category_tags, time_limit, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
          [qData.title, qData.title_en, qData.description, qData.description_en, qData.category_tags, qData.time_limit, uploaderId]
        );
        const quizId = quizResult.insertId;

        for (const question of qData.questions) {
          await conn.query(
            `INSERT INTO questions (quiz_id, question_text, question_text_en, image_url, option_a, option_a_en, option_b, option_b_en, option_c, option_c_en, option_d, option_d_en, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              quizId,
              question.question_text,
              question.question_text_en,
              question.image_url,
              question.option_a,
              question.option_a_en,
              question.option_b,
              question.option_b_en,
              question.option_c,
              question.option_c_en,
              question.option_d,
              question.option_d_en,
              question.correct_option
            ]
          );
        }
      }

      console.log('14 default quizzes and questions seeded successfully!');
      console.log('Database reset completed successfully!');
    } finally {
      conn.release();
    }

    process.exit(0);
  } catch (err) {
    console.error('Database reset failed:', err);
    process.exit(1);
  }
};

seed();

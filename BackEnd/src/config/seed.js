const bcrypt = require('bcryptjs');
const { pool, initDb } = require('./db');

const seed = async () => {
  try {
    console.log('Initializing database tables...');
    await initDb();
    console.log('Tables initialized. Starting seeding...');

    const conn = await pool.getConnection();
    try {
      // Clear existing data
      await conn.query('SET FOREIGN_KEY_CHECKS = 0');
      await conn.query('TRUNCATE TABLE audit_log');
      await conn.query('TRUNCATE TABLE quiz_sessions');
      await conn.query('TRUNCATE TABLE scores');
      await conn.query('TRUNCATE TABLE questions');
      await conn.query('TRUNCATE TABLE quizzes');
      await conn.query('TRUNCATE TABLE users');
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');

      const salt = await bcrypt.genSalt(10);
      const adminPass = await bcrypt.hash('Admin123', salt);
      const uploaderPass = await bcrypt.hash('Upload123', salt);
      const playerPass = await bcrypt.hash('Player123', salt);

      // Seed Admin
      const [adminResult] = await conn.query(
        `INSERT INTO users (username, email, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
        ['admin', 'admin@gameguessr.com', adminPass, 'Administrator', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin']
      );
      const adminId = adminResult.insertId;

      // Seed Uploader
      const [uploaderResult] = await conn.query(
        `INSERT INTO users (username, email, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
        ['uploader1', 'uploader@gameguessr.com', uploaderPass, 'Quiz Master', 'uploader', 'https://api.dicebear.com/7.x/avataaars/svg?seed=uploader1']
      );
      const uploaderId = uploaderResult.insertId;

      // Seed Players
      const players = [
        { username: 'ProGamer99', email: 'progamer@test.com', display: 'Pro Gamer 99' },
        { username: 'GameWizard', email: 'wizard@test.com', display: 'The Game Wizard' },
        { username: 'PixelHero', email: 'pixel@test.com', display: 'Pixel Hero' },
        { username: 'NightOwl', email: 'night@test.com', display: 'Night Owl' },
        { username: 'SpeedRunner', email: 'speed@test.com', display: 'Speed Runner' },
      ];
      const playerIds = [];
      for (const p of players) {
        const [result] = await conn.query(
          `INSERT INTO users (username, email, password, display_name, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
          [p.username, p.email, playerPass, p.display, 'participant', `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`]
        );
        playerIds.push(result.insertId);
      }

      // Seed Quiz 1: Popular PC Games
      const [quiz1Result] = await conn.query(
        `INSERT INTO quizzes (title, description, category_tags, time_limit, created_by, status) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Popular PC Games', 'Test your knowledge of modern and classic PC masterpieces!', 'PC,Gaming,Popular', 30, uploaderId, 'published']
      );
      const quiz1Id = quiz1Result.insertId;

      const quiz1Questions = [
        {
          text: 'Which game is set in the fantasy land of "The Lands Between" and was directed by Hidetaka Miyazaki?',
          image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
          a: 'Skyrim', b: 'Dark Souls III', c: 'Elden Ring', d: 'The Witcher 3', correct: 'C'
        },
        {
          text: 'Which open-world sandbox game allows players to build and explore 3D worlds made of blocks?',
          image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80',
          a: 'Terraria', b: 'Roblox', c: 'Lego Worlds', d: 'Minecraft', correct: 'D'
        },
        {
          text: 'Which tactical 5v5 shooter is developed by Riot Games?',
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
          a: 'Counter-Strike 2', b: 'Valorant', c: 'Apex Legends', d: 'Overwatch 2', correct: 'B'
        },
        {
          text: 'Which futuristic action RPG features Night City, a dystopian cyberpunk metropolis?',
          image: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=800&q=80',
          a: 'Deus Ex', b: 'Cyberpunk 2077', c: 'Fallout 4', d: 'Starfield', correct: 'B'
        },
        {
          text: 'Which battle royale game features Legends with unique abilities and takes place in the Outlands?',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
          a: 'Fortnite', b: 'PUBG', c: 'Apex Legends', d: 'Call of Duty Warzone', correct: 'C'
        }
      ];

      for (const q of quiz1Questions) {
        await conn.query(
          `INSERT INTO questions (quiz_id, question_text, image_url, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [quiz1Id, q.text, q.image, q.a, q.b, q.c, q.d, q.correct]
        );
      }

      // Seed Quiz 2: RPG Masterpieces
      const [quiz2Result] = await conn.query(
        `INSERT INTO quizzes (title, description, category_tags, time_limit, created_by, status) VALUES (?, ?, ?, ?, ?, ?)`,
        ['RPG Masterpieces', 'How well do you know the greatest RPGs ever made?', 'RPG,Adventure,Classic', 30, uploaderId, 'published']
      );
      const quiz2Id = quiz2Result.insertId;

      const quiz2Questions = [
        {
          text: 'Which game features the monster slayer Geralt of Rivia searching for his adopted daughter Ciri?',
          image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
          a: 'The Witcher 3: Wild Hunt', b: 'Dragon Age: Inquisition', c: 'Skyrim', d: 'Fable', correct: 'A'
        },
        {
          text: 'Which post-apocalyptic RPG series is known for its Vaults and "Pip-Boy" wearable computer?',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
          a: 'Borderlands', b: 'Metro Exodus', c: 'Fallout', d: 'Stalker', correct: 'C'
        },
        {
          text: 'In which game do you explore the province of Skyrim as the legendary Dragonborn?',
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
          a: 'Dark Souls', b: 'Dragon Age', c: 'The Elder Scrolls V: Skyrim', d: 'Baldurs Gate 3', correct: 'C'
        }
      ];

      for (const q of quiz2Questions) {
        await conn.query(
          `INSERT INTO questions (quiz_id, question_text, image_url, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [quiz2Id, q.text, q.image, q.a, q.b, q.c, q.d, q.correct]
        );
      }

      // Seed Quiz 3: Mobile Games
      const [quiz3Result] = await conn.query(
        `INSERT INTO quizzes (title, description, category_tags, time_limit, created_by, status) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Mobile Gaming Legends', 'Can you guess these popular mobile games?', 'Mobile,Casual,Popular', 25, adminId, 'published']
      );
      const quiz3Id = quiz3Result.insertId;

      const quiz3Questions = [
        {
          text: 'Which mobile game features a battle between two teams of 5 players in a MOBA format and is made by Moonton?',
          image: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=800&q=80',
          a: 'League of Legends Wild Rift', b: 'Mobile Legends: Bang Bang', c: 'Arena of Valor', d: 'Vainglory', correct: 'B'
        },
        {
          text: 'Which hyper-casual mobile game involves stacking and balancing objects?',
          image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&w=800&q=80',
          a: 'Stack Ball', b: 'Helix Jump', c: 'Crossy Road', d: 'Flappy Bird', correct: 'A'
        }
      ];

      for (const q of quiz3Questions) {
        await conn.query(
          `INSERT INTO questions (quiz_id, question_text, image_url, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [quiz3Id, q.text, q.image, q.a, q.b, q.c, q.d, q.correct]
        );
      }

      // Seed Scores for leaderboard
      const scoreData = [
        { userId: playerIds[0], quizId: quiz1Id, score: 4000, time: 120 },
        { userId: playerIds[1], quizId: quiz1Id, score: 3500, time: 95 },
        { userId: playerIds[2], quizId: quiz1Id, score: 3000, time: 110 },
        { userId: playerIds[3], quizId: quiz1Id, score: 2000, time: 140 },
        { userId: playerIds[4], quizId: quiz1Id, score: 1500, time: 88 },
        { userId: playerIds[0], quizId: quiz2Id, score: 2500, time: 75 },
        { userId: playerIds[1], quizId: quiz2Id, score: 2000, time: 60 },
        { userId: playerIds[2], quizId: quiz2Id, score: 1500, time: 80 },
        { userId: playerIds[0], quizId: quiz3Id, score: 1500, time: 45 },
        { userId: playerIds[3], quizId: quiz3Id, score: 1000, time: 50 },
      ];

      for (const s of scoreData) {
        await conn.query(
          `INSERT INTO scores (user_id, quiz_id, score, time_taken) VALUES (?, ?, ?, ?)`,
          [s.userId, s.quizId, s.score, s.time]
        );
      }

      console.log('Database seeded successfully!');
      console.log('---');
      console.log('Test Accounts:');
      console.log('  Admin    -> admin@gameguessr.com / Admin123');
      console.log('  Uploader -> uploader@gameguessr.com / Upload123');
      console.log('  Player   -> progamer@test.com / Player123');
      console.log('---');
    } finally {
      conn.release();
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding process failed:', err);
    process.exit(1);
  }
};

seed();

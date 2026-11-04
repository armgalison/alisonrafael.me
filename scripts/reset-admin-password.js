#!/usr/bin/env node

/**
 * Reset Admin Password Script
 *
 * Generates a random password, creates its bcrypt hash, and updates the admin user in the database.
 *
 * Usage:
 *   node scripts/reset-admin-password.js
 *   node scripts/reset-admin-password.js "seu@email.com"
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'server/.env' });

const crypto = require('crypto');

// Generate random password (16 chars)
function generatePassword() {
  return crypto.randomBytes(12).toString('base64').replace(/[=+/]/g, '').slice(0, 16);
}

async function resetPassword(email = 'armg.alison@gmail.com') {
  try {
    // Generate password
    const newPassword = generatePassword();
    console.log('\n🔐 Gerando nova senha...');
    console.log(`Senha gerada: ${newPassword}`);

    // Hash password
    console.log('\n🔐 Gerando hash bcrypt...');
    const saltRounds = 10;
    const hash = await bcrypt.hash(newPassword, saltRounds);
    console.log(`Hash: ${hash.slice(0, 20)}...`);

    // Connect to database
    console.log('\n📦 Conectando ao banco de dados...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'alisonrafael'
    });

    console.log(`✅ Conectado em ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

    // Update password
    console.log(`\n🔄 Atualizando senha para ${email}...`);
    const [result] = await connection.execute(
      'UPDATE admins SET passwordHash = ? WHERE email = ?',
      [hash, email]
    );

    if (result.affectedRows === 0) {
      console.log(`❌ Erro: Nenhum admin encontrado com email ${email}`);
      process.exit(1);
    }

    console.log(`✅ Senha atualizada! (${result.affectedRows} registros afetados)`);

    // Verify
    const [admins] = await connection.execute(
      'SELECT id, email FROM admins WHERE email = ?',
      [email]
    );

    if (admins.length > 0) {
      console.log(`✅ Admin verificado: ${admins[0].email}`);
    }

    await connection.end();

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 CREDENCIAIS RESETADAS:');
    console.log('='.repeat(50));
    console.log(`Email:    ${email}`);
    console.log(`Senha:    ${newPassword}`);
    console.log('='.repeat(50));
    console.log('\n✅ Pronto! Você pode fazer login agora.\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

// Get email from command line or use default
const email = process.argv[2] || 'armg.alison@gmail.com';
resetPassword(email);

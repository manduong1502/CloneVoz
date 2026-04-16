const { Client } = require('ssh2');

const conn = new Client();
const log = (msg) => console.log('=>', msg);

conn.on('ready', () => {
  log('Client :: ready');
  conn.shell((err, stream) => {
    if (err) throw err;
    
    stream.on('close', () => {
      log('Stream :: close');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    // Xóa thư mục cũ (nếu có) và Clone code
    stream.write('rm -rf CloneVoz\n');
    stream.write('git clone https://github.com/manduong1502/CloneVoz.git\n');
    stream.write('cd CloneVoz\n');
    
    // Cấp quyền và chạy Script
    stream.write('chmod +x vps-setup.sh\n');
    stream.write('./vps-setup.sh\n');
    
    // Chèn ENV
    stream.write('cp .env.vps-sample .env\n');
    stream.write('npm install\n');
    stream.write('npx prisma db push --accept-data-loss\n');
    stream.write('npm run build\n');
    
    // Chạy PM2
    stream.write('pm2 delete voz-app || true\n');
    stream.write('pm2 start npm --name "voz-app" -- run start\n');
    
    // Copy Nginx ra ngoài
    stream.write('cp vps-nginx.conf /etc/nginx/sites-available/voz\n');
    stream.write('ln -s /etc/nginx/sites-available/voz /etc/nginx/sites-enabled/voz || true\n');
    stream.write('systemctl restart nginx\n');
    
    stream.write('exit\n');
  });
}).connect({
  host: '103.170.123.221',
  port: 22,
  username: 'root',
  password: 'R1g6FOTewdahhvlR'
});

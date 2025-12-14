import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Wedding from '../models/Wedding';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thiepcuoi';

const sampleWedding = {
  slug: 'duy-huyen-01122025',
  groomName: 'Hồng Duy',
  brideName: 'Minh Huyền',
  groomFullName: 'Lê Hồng Duy',
  brideFullName: 'Đàm Thị Minh Huyền',
  weddingDate: new Date('2025-12-01T15:30:00'),
  saveTheDateText: 'Thật vui vì được gặp và đón tiếp các bạn trong một dịp đặc biệt - Ngày cưới của chúng mình. Chúng mình muốn gửi đến bạn những lời cảm ơn sâu sắc nhất và để bạn biết rằng chúng mình rất hạnh phúc khi thấy bạn ở đó. Cảm ơn các bạn rất nhiều vì sự hiện diện cùng những lời chúc tốt đẹp mà bạn đã dành cho chúng mình nha!',
  groomDescription: 'Là một người hiền lành và nhẹ nhàng. Thích thể thao, nghe nhạc, thích kiếm tiền và tiêu tiền. Đặc biệt tên không dấu nhưng lại "Thích Huyền". Luôn coi trọng tình cảm và yêu thương gia đình. Đối với mình "Gia đình là trên hết"',
  brideDescription: 'Là một người hay cười nhưng lại sống nội tâm và hay khóc thầm, không thích đọc sách nhưng thích mua, thích đi du lịch, thích trồng hoa. Và mình cũng thích a Duy nữa :3',
  story: [
    {
      title: 'Chúng mình đã từng...',
      content: 'Chúng mình đã từng là bạn, là đồng nghiệp của nhau. Gặp nhau vào một ngày cuối thu Hà Nội, khi gió se se còn nắng thì vẫn dịu dàng. Lúc đó, cả hai đều không nghĩ rằng một ngày nào đó, người kia sẽ trở thành NGƯỜI QUAN TRỌNG. Vậy mà sau nhiều câu chuyện, nhiều lần lắng nghe và đồng hành… chúng mình đã dần bước vào cuộc sống của nhau nhẹ nhàng như thế.',
      date: 'BẮT ĐẦU TỪ'
    },
    {
      title: 'Tình bạn thành tình yêu..',
      content: 'Thời điểm ấy, mỗi người một nơi, mỗi người một cuộc sống riêng. Nhưng chẳng hiểu từ khi nào, việc kể nhau nghe chuyện trong ngày, hỏi han nhau vài điều nhỏ, lại trở thành thói quen khó bỏ. Rồi đến một ngày, chúng mình không còn gọi nhau là "bạn" nữa. Ngày Hà Nội trở lạnh hơn một chút, và trái tim thì ấm lên một chút — chúng mình chọn ở bên nhau. Từ hôm đó, đã có một CHÚNG MÌNH thật đẹp.',
      date: 'MÙA THU NĂM ẤY'
    },
    {
      title: 'Ngày chung đôi',
      content: 'Ba năm yêu thương không phải là quá dài, nhưng cũng đủ để chúng mình hiểu rằng: bình yên nhất chính là khi nhìn về tương lai và thấy có nhau. Cảm ơn vì đã luôn đồng hành, lắng nghe và trưởng thành cùng nhau. Từ hôm nay, không chỉ là Anh và Em nữa, mà là Vợ và Chồng, là một gia đình nhỏ – trọn vẹn và hạnh phúc.',
      date: '01/12/2025 và sau nữa'
    }
  ],
  events: [
    {
      title: 'LỄ VU QUY',
      time: '10:00',
      date: '01/12/2025',
      location: 'Nhà Cô Dâu',
      address: 'Thôn Phúc Lâm Trung, Xã Phúc Sơn, Hà Nội'
    },
    {
      title: 'LỄ THÀNH HÔN',
      time: '15:30',
      date: '01/12/2025',
      location: 'Nhà Chú Rể',
      address: 'Thôn 1, Xã Quý Lộc, tỉnh Thanh Hóa'
    }
  ],
  parents: {
    groom: {
      father: 'Lê Duy Hưng',
      mother: 'Lê Thị Vân'
    },
    bride: {
      father: 'Đàm Chí Trung',
      mother: 'Đoàn Thị Chín'
    }
  },
  closingMessage: 'Huy Thanh rất vui khi được đồng hành cùng hai bạn trong chặng đường hạnh phúc. Dù sông có đổi núi có dời, chúc hai bạn vẫn một đời thương nhau <3',
  bankAccounts: {
    groom: {
      bank: 'TPBANK',
      name: 'Lê Hồng Duy',
      accountNumber: '28962168888'
    },
    bride: {
      bank: 'TPBANK',
      name: 'Đàm Thị Minh Huyền',
      accountNumber: '86903011997'
    }
  }
};

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if wedding already exists
    const existing = await Wedding.findOne({ slug: sampleWedding.slug });
    if (existing) {
      console.log(`⚠️  Wedding with slug "${sampleWedding.slug}" already exists`);
      console.log('Updating existing wedding...');
      await Wedding.findOneAndUpdate({ slug: sampleWedding.slug }, sampleWedding, { new: true });
      console.log('✅ Updated existing wedding');
    } else {
      // Create sample wedding
      const wedding = new Wedding(sampleWedding);
      await wedding.save();
      console.log('✅ Created sample wedding:', wedding.slug);
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log(`\n📝 Wedding URL: http://localhost:3000/?slug=${sampleWedding.slug}`);
    console.log(`⚙️  Admin URL: http://localhost:3000/admin`);
    console.log('\n💡 Bạn có thể upload ảnh và chỉnh sửa nội dung từ trang admin');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding data:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Wedding với slug này đã tồn tại');
    }
    process.exit(1);
  }
}

seed();

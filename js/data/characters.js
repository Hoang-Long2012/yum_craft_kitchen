// Character catalog used by the game.

export const CHARACTERS = [
      {
        id: 'chef_bear',
        name: 'Bếp Trưởng Gấu Bự',
        title: 'Đầu bếp sành ăn Đậm Đà',
        emoji: '🐻‍❄️',
        color: '#d97706',
        desc: 'Mê thịt bò, xúc xích, bánh mì nhồi đầy nhân, món nướng than hoa và đồ ngọt đậm vị cacao/sữa.',
        cravings: [
          'Hôm nay tôi thèm một ổ bánh mì Việt Nam nhồi thịt bò áp chảo, xúc xích và pa-tê, thêm chút tiêu đen, chanh với muối nhé!',
          'Đầu bếp thử cuộn pa-tê gan trong lát thịt bò rồi nướng trên vỉ than hoa thơm lừng xem sao!',
          'Tôi đang thèm một ly sinh tố sữa ca-cao đá mát lạnh, ăn kèm bánh quy Oreo giòn rụm!',
          'Pha cho tôi ly cà phê sữa đậm đà với cà phê phin và sữa đặc, béo ngậy thơm nức mũi nhé!'
        ],
        likes: ['umami', 'aroma', 'salty', 'sweet'],
        lovesStructures: ['stuffed', 'rolled'],
        maxSpiceTolerance: 7.5,
        hatesRawMeat: true
      },
      {
        id: 'cat_miu',
        name: 'Cô Bé Mèo Miu',
        title: 'Tín đồ Món Cuốn & Tráng Miệng',
        emoji: '🐱',
        color: '#ec4899',
        desc: 'Cực thích gỏi cuốn bánh tráng, kimbap rong biển cá hồi, đồ ngọt (sữa tươi, sô-cô-la, oreo) và vị chua ngọt thanh mát.',
        cravings: [
          'Miu thèm một cuốn gỏi cuốn bánh tráng với tôm luộc, bún tươi và xà lách rau thơm, chấm nước sốt chua ngọt!',
          'Làm cho Miu món cơm cuộn rong biển nhân cá hồi và bơ sáp béo ngậy nha!',
          'Miu muốn một ly sinh tố dâu tây, sô-cô-la và sữa đặc ngọt ngào, xay cùng đá viên mát lạnh!',
          'Miu muốn ăn kẹo hồ lô xiên dâu tây, phủ lớp đường caramel óng ánh giòn tan!'
        ],
        likes: ['sweet', 'sour', 'umami', 'fatty'],
        lovesStructures: ['rolled'],
        maxSpiceTolerance: 4.0,
        hatesRawMeat: true
      },
      {
        id: 'dragon_long',
        name: 'Anh Chàng Rồng Lửa',
        title: 'Vua Ăn Cay & Chiên Nướng',
        emoji: '🐲',
        color: '#dc2626',
        desc: 'Đam mê vị cay nồng của ớt, tiêu đen, tỏi phi, xúc xích nhồi thịt nướng than và các món chiên giòn rụm.',
        cravings: [
          'Ta thèm xúc xích nhồi thịt băm, nướng trên than hoa rồi rưới thật nhiều ớt hiểm và tương ớt cay nồng!',
          'Hãy cuốn bánh tráng nhân thịt ba chỉ và tôm, rồi chiên ngập dầu thành chả giò giòn tan!',
          'Làm cho ta chiếc taco ngô giòn nhồi thịt bò xào cay xè lưỡi nhé!',
          'Pha cho ta tách espresso đậm đặc, nóng hổi để bừng bừng ngọn lửa nhiệt huyết!'
        ],
        likes: ['spicy', 'aroma', 'umami', 'salty'],
        lovesStructures: ['stuffed', 'loose'],
        maxSpiceTolerance: 10.0,
        hatesRawMeat: true
      },
      {
        id: 'owl_prof',
        name: 'Giáo Sư Cú Thông Thái',
        title: 'Nhà phê bình Ẩm thực Cân Bằng',
        emoji: '🦉',
        color: '#4f46e5',
        desc: 'Đánh giá khắt khe sự cân bằng âm dương ngũ hành: thịt phải ướp gia vị, đồ béo ngọt phải có độ chua/thơm giải ngấy.',
        cravings: [
          'Tôi muốn thưởng thức phở cuốn Hà Nội nhân thịt bò xào tỏi, tiêu và rau thơm thanh tao.',
          'Hãy thử nhồi thịt bò băm, nấm hương và phô mai vào ớt chuông rồi nướng trong lò nhé!',
          'Món tráng miệng với sô-cô-la đắng, bột ca-cao và marshmallow nướng chảy hẳn sẽ rất tuyệt.',
          'Một chén chè hạt sen hầm đường phèn thanh mát sẽ bồi bổ tinh thần tuyệt hảo.'
        ],
        likes: ['aroma', 'umami', 'sour', 'sweet'],
        lovesStructures: ['rolled', 'stuffed'],
        maxSpiceTolerance: 6.5,
        hatesRawMeat: true
      },
      {
        id: 'fox_gourmet',
        name: 'Chàng Cáo Sành Điệu',
        title: 'Nhà Ẩm thực Hải Sản & Tươi Mát',
        emoji: '🦊',
        color: '#ea580c',
        desc: 'Mê mẩn hải sản tươi sống và các món hấp thanh ngọt tự nhiên; đặc biệt yêu thích vị Umami thuần khiết từ biển cả, ghét món quá khét hoặc quá mặn chát.',
        cravings: [
          'Tôi muốn nếm thử tôm hùm biển hoặc bào ngư hấp cách thủy để cảm nhận vị ngọt thanh tự nhiên!',
          'Hãy cuốn cá hồi với bánh tráng, ăn kèm rong nho biển và muối tiêu chanh nhé!',
          'Một phần cơm gói lá sen hấp thơm mùi thảo mộc sẽ khiến tôi vô cùng thán phục!',
          'Pha cho tôi ly trà đào cam sả mát lạnh, ăn kèm vài miếng đào giòn ngọt nhé!'
        ],
        likes: ['umami', 'sweet', 'aroma'],
        lovesStructures: ['rolled', 'stuffed'],
        maxSpiceTolerance: 5.0,
        hatesRawMeat: true
      },
      {
        id: 'rabbit_gardener',
        name: 'Thỏ Trắng Vườn Rau',
        title: 'Người mê rau củ & món thanh nhẹ',
        emoji: '🐰',
        color: '#16a34a',
        desc: 'Yêu rau củ tươi, nấm, trái cây và những món cuốn thanh mát; thích vị chua dịu cùng hương thơm thảo mộc.',
        cravings: [
          'Làm cho tôi cuốn bánh tráng với xà lách, dưa leo, cà rốt và rau thơm, chấm chút sốt bơ đậu phộng nhé!',
          'Tôi muốn thử nấm hương và đậu hũ non hấp mềm, nêm nhẹ nước tương với gừng thơm.',
          'Xay giúp tôi ly sinh tố dâu tây, xoài chín và sữa tươi mát lạnh nha!',
          'Một phần khoai lang mật nướng thơm, rắc chút mè rang sẽ hợp buổi chiều làm vườn đấy!'
        ],
        likes: ['sweet', 'sour', 'aroma', 'umami'],
        lovesStructures: ['rolled', 'loose'],
        maxSpiceTolerance: 2.5,
        hatesRawMeat: true
      }
    ];

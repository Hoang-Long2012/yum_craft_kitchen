// Cooking station definitions.

export const STATIONS = [
      {
        id: 'cutting_board',
        name: 'Thớt & Dao Sắc',
        shortName: '1. Dao Thớt',
        emoji: '🔪',
        temp: '25°C (Sơ chế)',
        desc: 'Thái lát, thái hạt lựu hoặc băm nhuyễn nguyên liệu',
        actions: [
          { id: 'slice', label: '🔪 Thái Lát Mỏng (C)', desc: 'Cắt lát mỏng đều đặn' },
          { id: 'dice', label: '🎲 Thái Hạt Lựu', desc: 'Thái vuông vức' },
          { id: 'mince', label: '⚡ Băm Nhuyễn', desc: 'Băm nhuyễn để nhồi nhân hoặc cuộn' }
        ]
      },
      {
        id: 'rolling_mat',
        name: 'Bàn Cuốn Đa Năng',
        shortName: '2. Bàn Cuốn',
        emoji: '🌯',
        temp: '25°C (Cuộn tay)',
        desc: 'Chọn 1 nguyên liệu làm vỏ ngoài (bánh tráng, rong biển, thịt bò lát...), cuộn gọn các nhân bên trong!',
        isRollingStation: true,
        actions: [
          { id: 'roll_tight', label: '🌯 Cuộn Tròn Lại (Phím R)', desc: 'Cuộn lớp vỏ ôm trọn các nhân bên trong' }
        ]
      },
      {
        id: 'stuffing_station',
        name: 'Trạm Kẹp & Nhồi Nhân',
        shortName: '3. Trạm Nhồi',
        emoji: '🥖',
        temp: '45°C (Bàn kẹp ấm)',
        desc: 'Chọn 1 nguyên liệu làm vỏ nhồi (bánh mì, xúc xích, ớt chuông, oreo...), xẻ ruột và nhồi đẫm nhân!',
        isStuffingStation: true,
        actions: [
          { id: 'stuff_pack', label: '🥖 Xẻ Ruột & Nhồi Đầy (Phím R)', desc: 'Xẻ ruột vỏ bánh/vật chứa và nhồi toàn bộ nhân vào trong' }
        ]
      },
      {
        id: 'frying_pan',
        name: 'Chảo Chiên Xào',
        shortName: '4. Chảo Xào',
        emoji: '🍳',
        temp: '185°C (Lửa vừa)',
        desc: 'Áp chảo thịt bò, chiên xúc xích, xào chín thơm dậy mùi Maillard',
        actions: [
          { id: 'fry_step', label: '🔥 Đảo Chảo / Áp Chảo (C)', desc: 'Chiên xào chín tới thơm vàng' }
        ]
      },
      {
        id: 'boiling_pot',
        name: 'Nồi Luộc & Hầm',
        shortName: '5. Nồi Luộc',
        emoji: '🍲',
        temp: '100°C (Nước sôi)',
        desc: 'Luộc tôm thịt chín mềm mọng hoặc nấu ca-cao sữa nóng',
        actions: [
          { id: 'boil_step', label: '💧 Đun Sôi / Hầm Mềm (C)', desc: 'Đun sôi và hòa quyện vị ngọt' }
        ]
      },
      {
        id: 'deep_fryer',
        name: 'Chảo Chiên Giòn',
        shortName: '6. Chiên Giòn',
        emoji: '🍟',
        temp: '195°C (Dầu sôi)',
        desc: 'Chiên ngập dầu giòn rụm chả giò, khoai tây, xúc xích',
        actions: [
          { id: 'deep_fry_step', label: '✨ Nhúng Dầu Chiên Giòn (C)', desc: 'Tạo lớp vỏ giòn tan béo ngậy' }
        ]
      },
      {
        id: 'oven',
        name: 'Lò Nướng Đa Năng',
        shortName: '7. Lò Nướng',
        emoji: '♨️',
        temp: '210°C (Nhiệt đối lưu)',
        desc: 'Nướng nóng giòn bánh mì nhồi, nướng thịt hoặc làm tan chảy phô mai / marshmallow',
        actions: [
          { id: 'bake_step', label: '⏲️ Bật Lò Nướng Vàng (C)', desc: 'Nướng chín giòn đều' }
        ]
      },
      {
        id: 'charcoal_grill',
        name: 'Vỉ Nướng Than Hoa',
        shortName: '8. Nướng Than',
        emoji: '🔥',
        temp: '240°C (Than hồng)',
        desc: 'Nướng thịt bò cuộn pate, xúc xích nhồi trên than hoa dậy mùi khói BBQ thơm nức',
        actions: [
          { id: 'grill_step', label: '🍖 Quạt Than Nướng Thơm (C)', desc: 'Nướng than hoa thơm lừng mùi khói' }
        ]
      },
      {
        id: 'blender',
        name: 'Máy Xay Sinh Tố',
        shortName: '9. Máy Xay',
        emoji: '🌪️',
        temp: '15°C (Xay đá tuyết)',
        desc: 'Xay nhuyễn sinh tố, sữa sô-cô-la oreo đá tuyết hoặc xay sốt sánh mịn',
        actions: [
          { id: 'blend_smooth', label: '🌪️ Bấm Máy Xay Nhuyễn (C)', desc: 'Xay mịn tất cả thành sinh tố / sốt' }
        ]
      },
      {
        id: 'beverage_station',
        name: 'Trạm Pha Chế Đồ Uống',
        shortName: '10. Pha Chế',
        emoji: '🍹',
        temp: '25°C (Pha chế)',
        desc: 'Khuấy ly, lắc bình shaker hoặc hãm nóng cà phê, trà, sữa và mọi thức uống tự do',
        isBeverageStation: true,
        actions: [
          { id: 'stir_pour', label: '🥄 Khuấy Đều & Rót Ly (C)', desc: 'Khuấy đều các thành phần trong ly thủy tinh' },
          { id: 'shake_shaker', label: '🫨 Lắc Bình Shaker (S)', desc: 'Lắc mạnh trong bình shaker để hòa tan và sủi bọt' },
          { id: 'brew_infuse', label: '♨️ Hãm Trà & Cà Phê Nóng (B)', desc: 'Rót nước sôi hãm nóng chiết xuất hương vị bốc khói' }
        ]
      },
      {
        id: 'steamer',
        name: 'Xửng Hấp Cách Thủy',
        shortName: '11. Xửng Hấp',
        emoji: '♨️',
        temp: '100°C (Hơi nước sôi)',
        desc: 'Hấp chín thức ăn bằng hơi nước bốc lên nhẹ nhàng, giữ trọn vị ngọt thanh, nước súp và dưỡng chất tinh túy',
        actions: [
          { id: 'steam_step', label: '♨️ Hấp Cách Thủy Bốc Hơi (C)', desc: 'Hấp chín mềm mọng nước, giữ trọn vị thanh tao và độ ngọt' }
        ]
      },
      {
        id: 'wok',
        name: 'Chảo Wok Đáy Sâu',
        shortName: '12. Chảo Wok',
        emoji: '🥘',
        temp: '200°C (Lửa lớn)',
        desc: 'Đảo nhanh rau củ, mì và thịt trên lửa lớn theo kiểu Á Đông',
        actions: [
          { id: 'fry_step', label: '🥘 Đảo Wok Lửa Lớn (C)', desc: 'Đảo nhanh tay để món ăn thơm nóng và chín đều' }
        ]
      },
      {
        id: 'grill_pan',
        name: 'Chảo Gang Vân Nướng',
        shortName: '13. Chảo Gang',
        emoji: '🍖',
        temp: '220°C (Gang nóng)',
        desc: 'Nướng áp mặt tạo vân xém thơm cho thịt, cá và rau củ',
        actions: [
          { id: 'grill_step', label: '🍖 Nướng Trên Chảo Gang (C)', desc: 'Làm xém mặt nguyên liệu với vân nướng đậm đà' }
        ]
      },
      {
        id: 'pressure_cooker',
        name: 'Nồi Áp Suất',
        shortName: '14. Nồi Áp Suất',
        emoji: '♨️',
        temp: '115°C (Áp suất cao)',
        desc: 'Ninh mềm thịt, đậu và củ quả nhanh chóng trong hơi nóng áp suất',
        actions: [
          { id: 'boil_step', label: '♨️ Ninh Áp Suất (C)', desc: 'Ninh mềm nguyên liệu và làm nước dùng đậm vị' }
        ]
      },
      {
        id: 'rice_cooker',
        name: 'Nồi Cơm Điện',
        shortName: '15. Nồi Cơm Điện',
        emoji: '🍚',
        temp: '100°C (Hấp và giữ ấm)',
        desc: 'Nấu chín cơm, ngũ cốc và làm mềm nguyên liệu bằng hơi nước kín',
        actions: [
          { id: 'rice_cook_step', label: '🍚 Nấu Chín Bằng Hơi Nước (C)', desc: 'Hấp chín dẻo và giữ độ ẩm trong nồi cơm điện' }
        ]
      },
      {
        id: 'air_fryer',
        name: 'Nồi Chiên Không Dầu',
        shortName: '16. Nồi Chiên Không Dầu',
        emoji: '🍟',
        temp: '200°C (Khí nóng tuần hoàn)',
        desc: 'Làm vàng giòn thực phẩm bằng luồng khí nóng, không cần ngập dầu',
        actions: [
          { id: 'air_fry_step', label: '🍟 Chiên Bằng Khí Nóng (C)', desc: 'Làm giòn bề mặt bằng khí nóng tuần hoàn' }
        ]
      },
      {
        id: 'microwave',
        name: 'Lò Vi Sóng',
        shortName: '17. Lò Vi Sóng',
        emoji: '📡',
        temp: 'Làm nóng nhanh',
        desc: 'Làm nóng và nấu chín nhanh từ bên trong bằng vi sóng',
        actions: [
          { id: 'microwave_step', label: '📡 Làm Nóng Bằng Vi Sóng (C)', desc: 'Làm nóng nhanh món ăn; thao tác lặp lại có thể làm món khô hoặc cháy' }
        ]
      }
    ];

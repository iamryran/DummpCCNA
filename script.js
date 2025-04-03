// Thay YOUR_MAPBOX_ACCESS_TOKEN bằng token của bạn từ tài khoản Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFkZXM2OCIsImEiOiJjbThwNzd0OHMwOHM4MmtxMXV6MjBjMzhlIn0.9SuGU5m8Su6fzYIAFENo7Q';

// Khởi tạo bản đồ với vị trí mặc định là Hà Nội
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [105.8342, 21.0278], // Tọa độ Hà Nội
    zoom: 12
});

// Tạo nút chọn ngôn ngữ
const languageSelector = document.createElement('div');
languageSelector.className = 'language-selector';
languageSelector.innerHTML = `
    <select id="language-select">
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
        <option value="zh">中文</option>
        <option value="ja">日本語</option>
        <option value="ko">한국어</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="es">Español</option>
        <option value="ru">Русский</option>
    </select>
`;

// Tạo control tùy chỉnh cho nút chọn ngôn ngữ
class LanguageControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        this._container.appendChild(languageSelector);
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

// Hàm thay đổi ngôn ngữ bản đồ
function changeMapLanguage(language) {
    // Danh sách các lớp nhãn cần thay đổi ngôn ngữ
    const labelLayers = [
        'country-label',
        'state-label',
        'settlement-label',
        'settlement-subdivision-label',
        'airport-label',
        'poi-label',
        'water-point-label',
        'water-line-label',
        'natural-point-label',
        'natural-line-label',
        'waterway-label',
        'road-label'
    ];

    // Thay đổi ngôn ngữ cho mỗi lớp
    labelLayers.forEach(layerId => {
        // Kiểm tra xem lớp có tồn tại không
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'text-field', ['get', `name_${language}`]);
        }
    });
}

// Thêm các controls khi bản đồ đã tải xong
map.on('load', function() {
    // Thêm control ngôn ngữ
    map.addControl(new LanguageControl(), 'top-right');

    // Lắng nghe sự kiện thay đổi ngôn ngữ
    document.getElementById('language-select').addEventListener('change', function(e) {
        changeMapLanguage(e.target.value);
    });

    // Thêm công cụ tìm kiếm
    map.addControl(
        new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            placeholder: 'Tìm kiếm địa điểm...',
            language: 'vi'
        })
    );

    // Thêm công cụ chỉ đường
    const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        language: 'vi',
        alternatives: true,
        congestion: true
    });
    map.addControl(directions, 'top-left');

    // Thêm các controls khác
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());
    
    // Thêm control vị trí với tùy chọn theo dõi vị trí
    const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    });
    map.addControl(geolocateControl);

    // Lắng nghe sự kiện khi vị trí người dùng được tìm thấy
    geolocateControl.on('geolocate', function(e) {
        // Lấy tọa độ vị trí thực tế của người dùng
        const userLng = e.coords.longitude;
        const userLat = e.coords.latitude;
        
        // Tạo marker tại vị trí người dùng
        new mapboxgl.Marker({color: '#FF0000'})
            .setLngLat([userLng, userLat])
            .setPopup(new mapboxgl.Popup().setHTML("<h3>Vị trí của bạn</h3><p>Tọa độ: " + userLng.toFixed(4) + ", " + userLat.toFixed(4) + "</p>"))
            .addTo(map);
        
        // Cập nhật nguồn dữ liệu vị trí thực tế
        if (map.getSource('user-location')) {
            map.getSource('user-location').setData({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [userLng, userLat]
                },
                properties: {
                    title: 'Vị trí của bạn'
                }
            });
        } else {
            // Tạo nguồn dữ liệu mới nếu chưa tồn tại
            map.addSource('user-location', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [userLng, userLat]
                    },
                    properties: {
                        title: 'Vị trí của bạn'
                    }
                }
            });
        }
    });

    // Thêm marker ví dụ
    new mapboxgl.Marker()
        .setLngLat([105.8342, 21.0278])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>Hà Nội</h3><p>Thủ đô Việt Nam</p>"))
        .addTo(map);

    // Thêm nguồn dữ liệu GeoJSON
    map.addSource('places', {
        type: 'geojson',
        data: 'locations.geojson' // Đường dẫn đến file GeoJSON của bạn
    });
    
    // Thêm lớp hiển thị các điểm
    map.addLayer({
        id: 'places',
        type: 'symbol',
        source: 'places',
        layout: {
            'icon-image': 'marker-15',
            'icon-size': 1.5,
            'text-field': ['get', 'title'],
            'text-offset': [0, 0.8],
            'text-anchor': 'top'
        }
    });

    // Thêm CSS cho nút chọn ngôn ngữ
    const style = document.createElement('style');
    style.innerHTML = `
        .language-selector {
            padding: 5px;
            background: white;
            border-radius: 4px;
        }
        #language-select {
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ccc;
        }
    `;
    document.head.appendChild(style);
    
    // Kích hoạt vị trí người dùng khi trang web tải xong
    setTimeout(() => {
        geolocateControl.trigger(); // Tự động kích hoạt vị trí người dùng
    }, 2000);
});

const API_CONFIG = {
    BASE_URL: 'http://217.114.43.85',
    ENDPOINTS: {
        // Templates endpoints
        TEMPLATES: '/api/templates',
        TEMPLATE_DETAILS: '/api/templates',
        DOWNLOAD: '/api/templates/download',
        CREATE: '/api/templates/create',
        SEARCH: '/api/templates/search',
        UNCHECKED: '/api/templates/unchecked',
        APPROVE: '/api/templates/approve',
        REJECT: '/api/templates/reject',
        DELETE: '/api/templates/delete',

        // User endpoints
        USER_REGISTER: '/api/user/register',
        USER_LOGIN: '/api/user/login',
        USER_FAVS: '/api/user/favs',
        USER_FAVS_ADD: '/api/user/favs/add',
        USER_FAVS_REMOVE: '/api/user/favs/remove',
        USER_UPLOADS: '/api/user/uploads',
        USER_INFO: '/api/user/info'
    }
};

export default API_CONFIG;

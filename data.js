// 叠滘龙船文化口述史档案库：数据存储与处理模块

const STORAGE_KEY = 'diejiao_dragon_boat_archives';
const OVERRIDES_KEY = 'diejiao_dragon_boat_archive_overrides';
const DELETED_KEY = 'diejiao_dragon_boat_deleted_archives';

function readStoredValue(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value !== null ? value : fallback;
    } catch (error) {
        console.warn(`无法读取本地数据 ${key}:`, error);
        return fallback;
    }
}

function writeStoredValue(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 迁移旧版数据：移除三条 sample_* 虚构档案，只保留用户自行新增的数据。
 */
function initStorage() {
    const storedArchives = readStoredValue(STORAGE_KEY, []);
    const builtInIds = new Set(archiveData.map(archive => archive.id));
    const customArchives = Array.isArray(storedArchives)
        ? storedArchives.filter(archive =>
            archive &&
            typeof archive.id === 'string' &&
            !archive.id.startsWith('sample_') &&
            !builtInIds.has(archive.id)
        )
        : [];

    writeStoredValue(STORAGE_KEY, customArchives);
    if (!localStorage.getItem(OVERRIDES_KEY)) {
        writeStoredValue(OVERRIDES_KEY, {});
    }
    if (!localStorage.getItem(DELETED_KEY)) {
        writeStoredValue(DELETED_KEY, []);
    }
}

/**
 * 返回内置访谈与用户新增档案；后台对内置档案的修改和删除也会保留在本机。
 */
function getAllArchives() {
    const customArchives = readStoredValue(STORAGE_KEY, []);
    const overrides = readStoredValue(OVERRIDES_KEY, {});
    const deletedIds = new Set(readStoredValue(DELETED_KEY, []));
    const builtInArchives = archiveData
        .filter(archive => !deletedIds.has(archive.id))
        .map(archive => overrides[archive.id] ? { ...archive, ...overrides[archive.id] } : archive);

    return [...customArchives, ...builtInArchives];
}

function getArchiveById(id) {
    return getAllArchives().find(archive => archive.id === id) || null;
}

/**
 * 搜索编号、标题、身份、类别、地点和访谈正文。
 */
function searchArchives(keyword) {
    const archives = getAllArchives();
    const normalizedKeyword = String(keyword || '').trim().toLocaleLowerCase('zh-CN');
    if (!normalizedKeyword) {
        return archives;
    }

    return archives.filter(archive => [
        archive.id,
        archive.title,
        archive.category,
        archive.role,
        archive.inheritor,
        archive.location,
        archive.content
    ].some(value => String(value || '').toLocaleLowerCase('zh-CN').includes(normalizedKeyword)));
}

function addArchive(archive) {
    try {
        const customArchives = readStoredValue(STORAGE_KEY, []);
        customArchives.unshift({
            ...archive,
            id: `archive_${Date.now()}`,
            createdAt: new Date().toISOString()
        });
        writeStoredValue(STORAGE_KEY, customArchives);
        return true;
    } catch (error) {
        console.error('添加档案失败:', error);
        return false;
    }
}

function updateArchive(id, updatedData) {
    try {
        const customArchives = readStoredValue(STORAGE_KEY, []);
        const customIndex = customArchives.findIndex(archive => archive.id === id);

        if (customIndex !== -1) {
            customArchives[customIndex] = { ...customArchives[customIndex], ...updatedData, id };
            writeStoredValue(STORAGE_KEY, customArchives);
            return true;
        }

        const original = archiveData.find(archive => archive.id === id);
        if (!original) {
            return false;
        }
        const overrides = readStoredValue(OVERRIDES_KEY, {});
        overrides[id] = { ...original, ...overrides[id], ...updatedData, id };
        writeStoredValue(OVERRIDES_KEY, overrides);
        return true;
    } catch (error) {
        console.error('更新档案失败:', error);
        return false;
    }
}

function deleteArchive(id) {
    try {
        const customArchives = readStoredValue(STORAGE_KEY, []);
        const remainingCustomArchives = customArchives.filter(archive => archive.id !== id);
        if (remainingCustomArchives.length !== customArchives.length) {
            writeStoredValue(STORAGE_KEY, remainingCustomArchives);
            return true;
        }

        if (!archiveData.some(archive => archive.id === id)) {
            return false;
        }
        const deletedIds = new Set(readStoredValue(DELETED_KEY, []));
        deletedIds.add(id);
        writeStoredValue(DELETED_KEY, [...deletedIds]);

        const overrides = readStoredValue(OVERRIDES_KEY, {});
        delete overrides[id];
        writeStoredValue(OVERRIDES_KEY, overrides);
        return true;
    } catch (error) {
        console.error('删除档案失败:', error);
        return false;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return String(dateString || '未记录');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

function escapeArchiveHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getSafeImageUrl(value) {
    const url = String(value || '').trim();
    return /^(https?:\/\/|\.\.?\/|assets\/)/i.test(url) ? url : '';
}

function generateArchiveCard(archive) {
    const content = String(archive.content || '');
    const shortContent = content.length > 96 ? `${content.substring(0, 96)}...` : content;
    const imageUrl = archive.images && archive.images.length > 0
        ? getSafeImageUrl(archive.images[0])
        : '';
    const archiveRole = archive.role || archive.category || '未分类';
    const archivePerson = archive.category || archive.inheritor || '未记录';
    const archiveDate = archive.collectDate || '未记录';

    return `
        <a href="detail.html?id=${encodeURIComponent(archive.id)}" class="archive-record group">
            <div class="archive-record-index">
                <span class="archive-record-label">口述档案</span>
                <strong>${escapeArchiveHtml(archive.id)}</strong>
            </div>
            <div class="archive-record-body">
                <div class="archive-record-meta">
                    <span>${escapeArchiveHtml(archiveRole)}</span>
                    <span>${escapeArchiveHtml(archiveDate)}</span>
                </div>
                <h3 class="archive-record-title">${escapeArchiveHtml(archive.title)}</h3>
                <p class="archive-record-person">${escapeArchiveHtml(archivePerson)}</p>
                <p class="archive-record-summary">${escapeArchiveHtml(shortContent)}</p>
                <span class="archive-record-link">查看档案 <span aria-hidden="true">→</span></span>
            </div>
            <div class="archive-record-thumb">
                ${imageUrl
                    ? `<img src="${escapeArchiveHtml(imageUrl)}" alt="${escapeArchiveHtml(archive.title)}">`
                    : '<div class="archive-placeholder" aria-hidden="true"><span class="archive-placeholder-seal"></span><i class="fas fa-ship"></i><span class="archive-placeholder-wave"></span></div>'
                }
            </div>
        </a>
    `;
}

initStorage();

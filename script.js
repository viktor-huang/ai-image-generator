document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const uploadStatus = document.getElementById('upload-status');
    const originalPreview = document.getElementById('original-preview');
    const resultPreview = document.getElementById('result-preview');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const productNameInput = document.getElementById('product-name');
    const promptTextarea = document.getElementById('prompt-textarea');
    const resetPromptBtn = document.getElementById('reset-prompt');
    const modelConfig = document.getElementById('model-config');
    const advancedConfig = document.getElementById('advanced-config');
    const advancedToggle = document.getElementById('advanced-toggle');
    const resetAdvancedBtn = document.getElementById('reset-advanced');
    
    // 模特属性选择
    const modelRace = document.getElementById('model-race');
    const modelGender = document.getElementById('model-gender');
    const modelAge = document.getElementById('model-age');
    const modelHair = document.getElementById('model-hair');
    const modelBody = document.getElementById('model-body');
    const modelHeight = document.getElementById('model-height');
    
    // 高级选项
    const composition = document.getElementById('composition');
    const angle = document.getElementById('angle');
    const aspectRatio = document.getElementById('aspect-ratio');
    const lighting = document.getElementById('lighting');
    const lightDirection = document.getElementById('light-direction');
    const style = document.getElementById('style');
    
    // 选项按钮
    const displayButtons = document.querySelectorAll('.option-btn.display');
    const poseButtons = document.querySelectorAll('.option-btn.pose');
    const sceneButtons = document.querySelectorAll('.option-btn.scene');
    
    // API配置 (隐藏在代码中)
    const apiConfig = {
        token: "HuP4xjVOD66LFFfq27Be2435-6368-4115-a4bB-A8515c60",
        model: "black-forest-labs/flux-kontext-pro"
    };
    
    // GitHub配置
    const githubConfig = {
        token: "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",
        owner: "viktor-huang",
        repo: "ai",
        branch: "main",
        path: "images/"
    };
    
    let selectedFile = null;
    let uploadedImageUrl = null;
    let generatedImage = null;
    let isPromptCustomized = false;
    let uploadTimeout = null;
    let isAdvancedExpanded = false;
    
    // 当前选择
    let currentDisplay = 'flat';
    let currentPose = 'front';
    let currentScene = 'white';
    
    // 初始化高级选项
    function initAdvancedOptions() {
        advancedToggle.addEventListener('click', function() {
            isAdvancedExpanded = !isAdvancedExpanded;
            advancedConfig.style.display = isAdvancedExpanded ? 'block' : 'none';
            advancedToggle.classList.toggle('expanded', isAdvancedExpanded);
        });
        
        resetAdvancedBtn.addEventListener('click', function() {
            composition.value = 'medium-shot';
            angle.value = 'eye-level';
            aspectRatio.value = 'square';
            lighting.value = 'soft';
            lightDirection.value = 'front';
            style.value = 'commercial';
            
            if (!isPromptCustomized) {
                updatePrompt();
            }
        });
        
        // 监听高级选项变化
        [composition, angle, aspectRatio, lighting, lightDirection, style].forEach(select => {
            select.addEventListener('change', () => {
                if (!isPromptCustomized) {
                    updatePrompt();
                }
            });
        });
    }
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 拖拽功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // 处理文件选择
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // 检查文件类型
            if (!file.type.match('image.*')) {
                showError('请选择图片文件（JPG、PNG）');
                return;
            }
            
            // 检查文件大小（最大5MB）
            if (file.size > 5 * 1024 * 1024) {
                showError('图片大小不能超过5MB');
                return;
            }
            
            selectedFile = file;
            
            // 显示预览
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                previewContainer.style.display = 'block';
                originalPreview.src = e.target.result;
                originalPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            // 隐藏错误信息
            errorMessage.style.display = 'none';
            generateBtn.disabled = true;
            
            // 自动上传到GitHub图床
            uploadStatus.textContent = '准备上传图片...';
            
            // 使用延迟上传，避免频繁请求
            if (uploadTimeout) {
                clearTimeout(uploadTimeout);
            }
            
            uploadTimeout = setTimeout(uploadToGitHub, 1000);
        }
    }
    
    // 上传到GitHub
    function uploadToGitHub() {
        if (!selectedFile) return;
        
        uploadStatus.textContent = '正在上传图片到图床...';
        
        // 生成文件名（使用时间戳避免重复）
        const timestamp = new Date().getTime();
        const fileExtension = selectedFile.name.split('.').pop();
        const fileName = `image_${timestamp}.${fileExtension}`;
        const fullPath = githubConfig.path + fileName;
        
        // 将文件转换为Base64
        const reader = new FileReader();
        reader.onload = function() {
            // 移除Base64前缀
            const base64Content = reader.result.split(',')[1];
            
            // 准备API请求
            const apiUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${fullPath}`;
            
            const requestData = {
                message: `Upload image ${fileName}`,
                content: base64Content,
                branch: githubConfig.branch
            };
            
            // 发送请求到GitHub API
            fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.content) {
                    // 上传成功，生成GitHub raw链接
                    uploadedImageUrl = `https://raw.githubusercontent.com/${githubConfig.owner}/${githubConfig.repo}/${githubConfig.branch}/${fullPath}`;
                    uploadStatus.textContent = '图片上传成功！';
                    
                    // 启用生成按钮
                    generateBtn.disabled = false;
                } else {
                    // 上传失败，显示错误
                    showError(data.message || '上传失败，请检查配置和网络连接');
                    uploadStatus.textContent = '上传失败';
                }
            })
            .catch(error => {
                showError('上传过程中发生错误: ' + error.message);
                uploadStatus.textContent = '上传失败';
            });
        };
        reader.readAsDataURL(selectedFile);
    }
    
    // 产品名称输入变化
    productNameInput.addEventListener('input', () => {
        if (!isPromptCustomized) {
            updatePrompt();
        }
    });
    
    // 提示词文本区域变化
    promptTextarea.addEventListener('input', () => {
        isPromptCustomized = true;
    });
    
    // 重置提示词按钮
    resetPromptBtn.addEventListener('click', () => {
        isPromptCustomized = false;
        updatePrompt();
    });
    
    // 展示方式选择
    displayButtons.forEach(button => {
        button.addEventListener('click', () => {
            displayButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentDisplay = button.dataset.display;
            
            // 显示或隐藏模特配置
            if (currentDisplay === 'model') {
                modelConfig.style.display = 'block';
            } else {
                modelConfig.style.display = 'none';
            }
            
            if (!isPromptCustomized) {
                updatePrompt();
            }
        });
    });
    
    // 摆放姿势选择
    poseButtons.forEach(button => {
        button.addEventListener('click', () => {
            poseButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentPose = button.dataset.pose;
            if (!isPromptCustomized) {
                updatePrompt();
            }
        });
    });
    
    // 背景场景选择
    sceneButtons.forEach(button => {
        button.addEventListener('click', () => {
            sceneButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentScene = button.dataset.scene;
            if (!isPromptCustomized) {
                updatePrompt();
            }
        });
    });
    
    // 模特属性变化
    [modelRace, modelGender, modelAge, modelHair, modelBody, modelHeight].forEach(select => {
        select.addEventListener('change', () => {
            if (!isPromptCustomized && currentDisplay === 'model') {
                updatePrompt();
            }
        });
    });
    
    // 生成图片按钮
    generateBtn.addEventListener('click', generateImage);
    
    // 下载图片按钮
    downloadBtn.addEventListener('click', downloadImage);
    
    // 更新提示词
    function updatePrompt() {
        const productName = productNameInput.value.trim() || '产品';
        let prompt = "";
        
        // 根据展示方式
        switch(currentDisplay) {
            case 'flat':
                prompt += `${productName}平铺`;
                break;
            case 'hanger':
                prompt += `${productName}悬挂在衣架上`;
                break;
            case 'model':
                // 获取模特属性
                const raceText = {
                    'asian': '亚洲黄种人',
                    'caucasian': '欧美白人',
                    'african': '黑人'
                }[modelRace.value];
                
                const genderText = {
                    'female': '女性',
                    'male': '男性'
                }[modelGender.value];
                
                const ageText = {
                    'young': '年轻',
                    'middle': '中年',
                    'mature': '成熟'
                }[modelAge.value];
                
                const hairText = {
                    'long': '长发',
                    'short': '短发',
                    'medium': '中长发'
                }[modelHair.value];
                
                const bodyText = {
                    'slim': '苗条',
                    'average': '中等身材',
                    'curvy': '丰满'
                }[modelBody.value];
                
                const heightText = {
                    'petite': '娇小',
                    'average': '中等身高',
                    'tall': '高挑'
                }[modelHeight.value];
                
                prompt += `${productName}由${raceText}${genderText}模特穿着，${ageText}，${hairText}，${bodyText}，${heightText}`;
                break;
            case 'hold':
                prompt += `${productName}由模特手持`;
                break;
            case 'stand':
                prompt += `${productName}放置在支架上`;
                break;
            case 'natural':
                prompt += `${productName}自然放置`;
                break;
        }
        
        // 根据摆放姿势
        switch(currentPose) {
            case 'front':
                prompt += "正面展示";
                break;
            case 'side':
                prompt += "侧面展示";
                break;
            case 'angle':
                prompt += "45度角展示";
                break;
            case 'folded':
                prompt += "折叠摆放";
                break;
            case 'stacked':
                prompt += "堆叠摆放";
                break;
            case 'hanging':
                prompt += "悬挂状态";
                break;
        }
        
        // 添加高级选项 - 构图
        const compositionText = {
            'full-body': '全身照',
            'medium-shot': '半身照',
            'three-quarter': '七分照',
            'close-up': '特写',
            'flat-lay': '平铺拍摄',
            'hanging': '挂拍'
        }[composition.value];
        
        prompt += `，${compositionText}`;
        
        // 添加高级选项 - 视角
        const angleText = {
            'eye-level': '平视角度',
            'high-angle': '俯视角度',
            'low-angle': '仰视角度',
            'dynamic': '动态视角'
        }[angle.value];
        
        prompt += `，${angleText}`;
        
        // 根据背景场景
        switch(currentScene) {
            case 'white':
                prompt += "在纯白背景";
                break;
            case 'living':
                prompt += "在居家客厅环境中，背景为浅灰色布艺沙发、原木色边几";
                break;
            case 'outdoor':
                prompt += "在户外公园草坪上，背景为蓝天、稀疏的树木";
                break;
            case 'cafe':
                prompt += "在城市街头咖啡馆户外座位区，背景为咖啡馆木质外摆桌、浅色系遮阳伞";
                break;
            case 'office':
                prompt += "在商务办公室工位上，背景为浅灰色办公隔断、电脑显示器";
                break;
            case 'studio':
                prompt += "在专业摄影棚中";
                break;
            case 'beach':
                prompt += "在海滩环境中，背景为沙滩和海水";
                break;
            case 'nature':
                prompt += "在自然风光中，背景为绿色植物和自然景观";
                break;
        }
        
        // 添加高级选项 - 光线
        const lightingText = {
            'soft': '柔和的灯光',
            'hard': '硬光照明',
            'natural': '自然光线',
            'studio': '专业影室灯光'
        }[lighting.value];
        
        const lightDirectionText = {
            'front': '正面照射',
            'side': '侧光照射',
            'back': '背光照射',
            'rim': '轮廓光照射'
        }[lightDirection.value];
        
        prompt += `，${lightingText}${lightDirectionText}`;
        
        // 添加高级选项 - 风格
        const styleText = {
            'commercial': '商业摄影风格',
            'lifestyle': '生活方式风格',
            'minimalist': '极简主义风格',
            'vintage': '复古风格'
        }[style.value];
        
        prompt += `，${styleText}`;
        
        // 确保产品保持不变
        prompt += "，高清8K画质，产品细节清晰，无阴影干扰，产品完全保持不变";
        
        promptTextarea.value = prompt;
    }
    
    // 生成图片
    async function generateImage() {
        if (!uploadedImageUrl) {
            showError('请先上传图片！');
            return;
        }
        
        const promptText = promptTextarea.value;
        if (!promptText) {
            showError('请提供提示词！');
            return;
        }
        
        loading.style.display = 'block';
        generateBtn.disabled = true;
        resultPreview.style.display = 'none';
        downloadBtn.style.display = 'none';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        try {
            // 调用API
            const response = await fetch('https://api.modelverse.cn/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiConfig.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: apiConfig.model,
                    prompt: promptText,
                    image: uploadedImageUrl
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            // 根据API响应结构获取生成的图片URL
            if (data && data.data && data.data.length > 0 && data.data[0].url) {
                generatedImage = data.data[0].url;
                resultPreview.src = generatedImage;
                successMessage.textContent = '图片生成成功！';
                successMessage.style.display = 'block';
            } else {
                throw new Error('API返回的数据格式不符合预期');
            }
            
            loading.style.display = 'none';
            resultPreview.style.display = 'block';
            downloadBtn.style.display = 'block';
            generateBtn.disabled = false;
            
        } catch (error) {
            loading.style.display = 'none';
            generateBtn.disabled = false;
            showError(`生成图片失败: ${error.message}`);
            console.error('API调用错误:', error);
        }
    }
    
    // 下载图片
    function downloadImage() {
        if (!generatedImage) return;
        
        const link = document.createElement('a');
        link.download = 'product-image-generated.png';
        link.href = generatedImage;
        link.click();
    }
    
    // 显示错误信息
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }
    
    // 显示成功信息
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
    
    // 初始化高级选项
    initAdvancedOptions();
    
    // 初始化提示词
    updatePrompt();
});
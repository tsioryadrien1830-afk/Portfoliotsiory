/**
 * CodeDropz Uploader
 * Copyright 2018 Glen Mongaya
 * CodeDrop Drag&Drop Uploader
 * @version 1.3.8.8
 * @author CodeDropz, Glen Don L. Mongaya
 * @license The MIT License (MIT)
 */

// CodeDropz Drag and Drop Plugin
!function(){let e=function(e){let t=document.querySelector("form.wpcf7-form");if(t){let r=new FormData;r.append("action","_wpcf7_check_nonce"),r.append("_ajax_nonce",dnd_cf7_uploader.ajax_nonce),fetch(dnd_cf7_uploader.ajax_url,{method:"POST",body:r}).then(e=>e.json()).then(({data:e,success:t})=>t&&(dnd_cf7_uploader.ajax_nonce=e)).catch(console.error)}var a=this;let d={handler:a,color:"#000",background:"",server_max_error:"Uploaded file exceeds the maximum upload size of your server.",max_file:a.dataset.max?a.dataset.max:10,max_upload_size:a.dataset.limit?a.dataset.limit:"10485760",supported_type:a.dataset.type?a.dataset.type:"jpg|jpeg|JPG|png|gif|pdf|doc|docx|ppt|pptx|odt|avi|ogg|m4a|mov|mp3|mp4|mpg|wav|wmv|xls",text:"Drag & Drop Files Here",separator:"or",button_text:"Browse Files",on_success:""},o=Object.assign({},d,e);var n=a.dataset.name+"_count_files";localStorage.setItem(n,1);let s=`
            <div class="codedropz-upload-handler">
                <div class="codedropz-upload-container">
                <div class="codedropz-upload-inner">
                    <${dnd_cf7_uploader.drag_n_drop_upload.tag}>${o.text}</${dnd_cf7_uploader.drag_n_drop_upload.tag}>
                    <span>${o.separator}</span>
                    <div class="codedropz-btn-wrap"><a class="cd-upload-btn" href="#">${o.button_text}</a></div>
                </div>
                </div>
                <span class="dnd-upload-counter"><span>0</span> ${dnd_cf7_uploader.dnd_text_counter} ${parseInt(o.max_file)}</span>
            </div>
        `,l=document.createElement("div");l.classList.add("codedropz-upload-wrapper"),o.handler.parentNode.insertBefore(l,o.handler),l.appendChild(o.handler),o.supported_type=o.supported_type.replace(/[^a-zA-Z0-9| ]/g,"");let p=o.handler.closest("form"),i=o.handler.closest(".codedropz-upload-wrapper"),c=p.querySelector('input[type="submit"], button[type="submit"]');o.handler.insertAdjacentHTML("afterend",s),["drag","dragstart","dragend","dragover","dragenter","dragleave","drop"].forEach(function(e){i.querySelector(".codedropz-upload-handler").addEventListener(e,function(e){e.preventDefault(),e.stopPropagation()})}),["dragover","dragenter"].forEach(function(e){i.querySelector(".codedropz-upload-handler").addEventListener(e,function(e){i.querySelector(".codedropz-upload-handler").classList.add("codedropz-dragover")})}),["dragleave","dragend","drop"].forEach(function(e){i.querySelector(".codedropz-upload-handler").addEventListener(e,function(e){i.querySelector(".codedropz-upload-handler").classList.remove("codedropz-dragover")})}),i.querySelector(".cd-upload-btn").addEventListener("click",function(e){e.preventDefault(),o.handler.value=null,o.handler.click()}),i.querySelector(".codedropz-upload-handler").addEventListener("drop",function(e){u(e.dataTransfer.files,"drop")}),o.handler.addEventListener("change",function(e){u(this.files,"click")}),/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)&&a.removeAttribute("accept"),a.setAttribute("data-random-id",function(e=20){let t="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",r=t.length,a="";for(let d=0;d<e;d++){let o=Math.floor(Math.random()*r);a+=t[o]}let n=Math.floor(Date.now()/1e3);return a+n}());var u=function(e,t){if(0==e.length)return;var r=new FormData;r.append("action","dnd_codedropz_upload"),r.append("type",t),r.append("security",dnd_cf7_uploader.ajax_nonce),r.append("form_id",a.dataset.id),r.append("upload_name",a.dataset.name),r.append("upload_folder",a.getAttribute("data-random-id"));let d=o.handler.querySelector(".has-error"),s=i.querySelector(".codedropz-upload-handler");for(let l of(d&&d.remove(),e)){if(void 0!==r.delete&&r.delete("upload-file"),Number(localStorage.getItem(n))>o.max_file){if(!i.querySelector("span.has-error-msg")){var c=dnd_cf7_uploader.drag_n_drop_upload.max_file_limit,u=document.createElement("span");u.className="has-error-msg",u.textContent=c.replace("%count%",o.max_file),s.parentNode.insertBefore(u,s.nextSibling)}return!1}let f=m.createProgressBar(l);var g=!1;if(l.size>o.max_upload_size){let v=document.getElementById(f),h=document.createElement("span");h.classList.add("has-error"),h.textContent=dnd_cf7_uploader.drag_n_drop_upload.large_file,v.querySelector(".dnd-upload-details").appendChild(h),g=!0}if(regex_type=RegExp("(.*?).("+o.supported_type+")$"),!1!==g||regex_type.test(l.name.toLowerCase())||(document.querySelector("#"+f+" .dnd-upload-details").insertAdjacentHTML("beforeend",'<span class="has-error">'+dnd_cf7_uploader.drag_n_drop_upload.inavalid_type+"</span>"),g=!0),localStorage.setItem(n,Number(localStorage.getItem(n))+1),!1===g){r.append("upload-file",l);var y=new XMLHttpRequest,x=document.getElementById(f),b=x.querySelector(".dnd-progress-bar"),S=x.querySelector(".dnd-upload-details"),$=p.querySelector('input[type="submit"], button[type="submit"]');y.open(p.getAttribute("method"),o.ajax_url),y.onreadystatechange=function(){if(4===this.readyState){if(200===this.status){var e=JSON.parse(this.responseText);e.success?(m.setProgressBar(f,100),"function"==typeof o.on_success&&o.on_success.call(this,a,f,e)):(b.remove(),S.insertAdjacentHTML("beforeend",'<span class="has-error">'+e.data+"</span>"),$&&($.classList.remove("disabled"),$.removeAttribute("disabled")),x.classList.remove("in-progress"))}else b.remove(),S.insertAdjacentHTML("beforeend",'<span class="has-error">'+o.server_max_error+"</span>"),$&&($.classList.remove("disabled"),$.removeAttribute("disabled")),x.classList.remove("in-progress")}},y.upload.addEventListener("progress",function(e){if(e.lengthComputable){var t=parseInt(100*(e.loaded/e.total));m.setProgressBar(f,t-1)}},!1),y.send(r)}}},m={createProgressBar:function(e){var t=i.querySelector(".codedropz-upload-handler"),r="dnd-file-"+Math.random().toString(36).substr(2,9),a=`
                    <div class="dnd-upload-image">
                        <span class="file"></span>
                    </div>
                    <div class="dnd-upload-details">
                        <span class="name"><span>${e.name}</span><em>(${m.bytesToSize(e.size)})</em></span>
                        <a href="#" title="${dnd_cf7_uploader.drag_n_drop_upload.delete.title}" class="remove-file" data-storage="${n}">
                        <span class="dnd-icon-remove"></span>
                        </a>
                        <span class="dnd-progress-bar"><span></span></span>
                    </div>
                `,d=document.createElement("div");return d.id=r,d.className="dnd-upload-status",d.innerHTML=a,t.parentNode.insertBefore(d,t.nextSibling),r},setProgressBar:function(e,t){let r=document.getElementById(e),a=r.querySelector(".dnd-progress-bar");if(a){c&&m.disableBtn(c);let d=t*a.offsetWidth/100;r.classList.add("in-progress"),100==t?(a.querySelector("span").style.width="100%",a.querySelector("span").textContent=`${t}% `):(a.querySelector("span").style.width=d+"px",a.querySelector("span").textContent=`${t}% `),100==t&&(r.classList.add("complete"),r.classList.remove("in-progress"))}return!1},bytesToSize:function(e){return 0===e?"0":fileSize=(kBytes=e/1024)>=1024?(kBytes/1024).toFixed(2)+"MB":kBytes.toFixed(2)+"KB"},disableBtn:function(e){e&&(e.classList.add("disable"),e.disabled=!0)}}};document.addEventListener("click",function(e){if(e.target.classList.contains("dnd-icon-remove")){e.preventDefault();var t=e.target,r=t.closest(".dnd-upload-status"),a=t.closest(".codedropz-upload-wrapper"),d=t.parentElement.getAttribute("data-storage"),o=Number(localStorage.getItem(d));if(r.classList.contains("in-progress")||r.querySelector(".has-error"))return r.remove(),localStorage.setItem(d,o-1),!1;t.classList.add("deleting"),t.textContent=dnd_cf7_uploader.drag_n_drop_upload.delete.text+"...";var n=new XMLHttpRequest;n.open("POST",dnd_cf7_uploader.ajax_url),n.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),n.onload=function(){if(200===this.status){var e=JSON.parse(this.responseText);if(e.success)r.remove(),localStorage.setItem(d,o-1),a.querySelectorAll(".dnd-upload-status").length<=1&&a.querySelector(".has-error-msg")&&a.querySelector(".has-error-msg").remove(),a.querySelector(".dnd-upload-counter span").textContent=Number(localStorage.getItem(d))-1;else{let t=r.querySelector(".dnd-upload-details");if(t){let n=document.createElement("span");n.classList.add("has-error-msg"),n.textContent=e.data,t.appendChild(n)}}}},n.send("path="+r.querySelector('input[type="hidden"]').value+"&action=dnd_codedropz_upload_delete&security="+dnd_cf7_uploader.ajax_nonce),document.querySelectorAll(".has-error-msg").forEach(function(e){e.remove()})}}),HTMLElement.prototype.CodeDropz_Uploader=e}();
// END: CodeDropz Uploader function

// Custom JS hook event
var dnd_upload_cf7_event = function(target, name, data) {
	// Create a custom event with the specified name and data
	var event = new CustomEvent('dnd_upload_cf7_' + name, {
		bubbles: true,
		detail: data
	});
	target.dispatchEvent(event);
}

// BEGIN: initialize upload
document.addEventListener('DOMContentLoaded', function() {

	// Fires when an Ajax form submission has completed successfully, and mail has been sent.
    document.addEventListener( 'wpcf7mailsent', function( event ) {

        // Get form
        const form = event.target;

        // Get input type file element
        var inputFile = form.querySelectorAll('.wpcf7-drag-n-drop-file');
        var status = form.querySelectorAll('.dnd-upload-status');
        var counter = form.querySelector('.dnd-upload-counter span');
        var error = form.querySelectorAll('span.has-error-msg');

        // Reset upload list for multiple fields
        if ( inputFile.length > 0 ) {
            inputFile.forEach( function(input) {
                localStorage.setItem( input.getAttribute('data-name') + '_count_files', 1 ); // Reset file counts
            });
        }

        // Remove status / progress bar
        if (status) {
            status.forEach(function(statEl){
                statEl.remove();
            });
        }

        if (counter) {
            counter.textContent = '0';
        }

        if (error) {
            error.forEach(function(errEl){
                errEl.remove();
            });
        }

    }, false );

	window.initDragDrop = function () {

		// Get text object options/settings from localize script
		var TextOJB = dnd_cf7_uploader.drag_n_drop_upload;
        var fileUpload = document.querySelectorAll('.wpcf7-drag-n-drop-file');

        fileUpload.forEach(function(Upload) {

            // Support Multiple Fileds
            Upload.CodeDropz_Uploader({
                'color': '#fff',
                'ajax_url': dnd_cf7_uploader.ajax_url,
                'text': TextOJB.text,
                'separator': TextOJB.or_separator,
                'button_text': TextOJB.browse,
                'server_max_error': TextOJB.server_max_error,
                'on_success': function(input, progressBar, response) {

                    // Progressbar Object
                    var progressDetails = document.querySelector('.codedropz-upload-wrapper #' + progressBar);
                    var form = input.closest('form');
                    var span = form.querySelector('.wpcf7-acceptance');
                    var checkboxInput = ( span ? span.querySelector('input[type="checkbox"]') : '' );

                    // Remove 'required' error message
                    const requiredMessage = input.closest('.codedropz-upload-wrapper').nextElementSibling;
                    if( requiredMessage && requiredMessage.classList.contains('wpcf7-not-valid-tip') ){
                        requiredMessage.remove();
                    }

                    // If it's complete remove disabled attribute in button
                    if ( ( span && span.classList.contains('optional') ) || ! span || checkboxInput.checked || form.classList.contains('wpcf7-acceptance-as-validation')) {
                        setTimeout(function(){
                            const submitButton = form.querySelector('button[type=submit], input[type=submit]');
                            if( submitButton ){
                                submitButton.removeAttribute('disabled');
                            }
                        }, 1);
                    }

                    // Append hidden input field
                    var detailsElement = progressDetails.querySelector('.dnd-upload-details');
                    var inputHTML = '<span><input type="hidden" name="' + input.dataset.name + '[]" value="' + response.data.path + '/' + response.data.file + '"></span>';
                    detailsElement.insertAdjacentHTML('beforeend', inputHTML);

                    // Update counter
                    var filesCounter = ( Number( localStorage.getItem( input.dataset.name + '_count_files' ) ) - 1);
                    var counterElement = input.closest('.codedropz-upload-wrapper').querySelector('.dnd-upload-counter span');
                    counterElement.textContent = filesCounter;

					// Add custom event
					dnd_upload_cf7_event( progressDetails, 'success', response );
                }
            });

        });

	}

	window.initDragDrop();

	// Usage: Custom js hook after success upload
	/*document.addEventListener( 'dnd_upload_cf7_success', function( event ) {
		console.log(event.detail);
	});*/

});
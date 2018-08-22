import React, {Component} from 'react';
import {Form, Input, Button, Select, Checkbox} from 'antd';

import Markdown from '../markdown';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import {Editor} from 'react-draft-wysiwyg';
import '../article-detail/react-draft-wysiwyg.css';

const FormItem = Form.Item;
const Option = Select.Option;

class ArticleDetail extends Component {
	constructor(props) {
		super(props);
		this.state = {
			content: '',
            editorState: EditorState.createEmpty(),
			markdown: '0',
			article: {},
			categories: []
		}
	}

	static contextTypes = {
		router: React.PropTypes.object
	};

	componentDidMount() {
		fetch("/get-categories", {
			credentials: 'include'
		}).then((res) => {
			if(res.status !== 200) {
				throw new Error('Load Failed, Status:' + res.status);
			}
			res.json().then((data) => {
				if(data.status === 0) {
					this.setState({error: data.message});
				}
				else {
					this.setState({categories: data.info});
				}
			}).catch((error) => {
				console.log(error);
			})
		}).catch((error) => {
			console.log(error);
		});

		let id = this.props.id;
		if(id != null) {
			fetch(`/article/${id}`, {
				credentials: 'include'
			}).then((res) => {
				if(res.status !== 200) {
					throw new Error('Load Failed, Status:' + res.status);
				}
				res.json().then((data) => {
					if(data.status === 0) {
						this.setState({error: data.message});
					}
					else {
						this.setState({content: EditorState.createWithContent(ContentState.createFromBlockArray(htmlToDraft(data.info.body || '')))});
						this.setState({editorState: EditorState.createWithContent(ContentState.createFromBlockArray(htmlToDraft(data.info.body || '')))});
						this.setState({markdown: data.info.markdown || '0'});
						this.setState({article: data.info});
					}
				}).catch((error) => {
					console.log(error);
				})
			}).catch((error) => {
				console.log(error);
			});
		}
	}

	handleChange = (content) => {
		this.state.content = content;
	};

    onEditorStateChange = (editorState) => {
        this.setState({
            editorState : editorState,
        });
        this.state.content = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    };

  uploadImageCallBack = (file) => {
    return new Promise(
      (resolve, reject) => {
        const formData = new FormData();
        formData.append('pic-upload', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3001/upload');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        xhr.setRequestHeader('Access-Control-Allow-Headers', 'X-Requested-With');
        xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
        xhr.send(formData);
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 || xhr.status < 300 || xhr.status === 304) {
              let result = JSON.parse(xhr.responseText);
              resolve({
                data: {
                  link: result.data.link
                }
              });
            } else {
              reject(xhr.status)
            }
          }
        }
      }
    );
  };

	handleTypeChange = (value) => {
		this.setState({markdown: value});
	};

	handlePreview = (e) => {
		this.setState({
			preview: e.target.checked
		})
	};

	handleSubmit = (e) => {
		e.preventDefault();

		this.props.form.validateFields((err, values) => {
			if(err) {
				return;
			}
 
			let {content = ''} = this.state;
			if(content.trim() === '') {
				alert('文章内容为空！');
				return;
			}

			values.id = this.props.id;
			values.content = content;

			fetch("/article-submit", {
				method: 'POST',
				credentials: 'include',
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(values)
			}).then((res) => {
				if(res.status !== 200) {
					throw new Error('Failed, Status:' + res.status);
				}
				res.json().then((data) => {
					if(data.status === 0) {
						this.setState({error: data.message});
					}
					else {
						alert("文章提交成功！");

						if(this.props.id == null) {
							this.context.router.push(`/articles`);
						}
					}
				}).catch((error) => {
					console.log(error);
				})
			}).catch((error) => {
				console.log(error);
			});
		});
	};

	render() {
		let {markdown, content, preview, editorState} = this.state;
		let {title, tag, type, category} = this.state.article;
		const {getFieldDecorator, getFieldsError, getFieldError, isFieldTouched} = this.props.form;

		const tagError = isFieldTouched('tag') && getFieldError('tag');
		const titleError = isFieldTouched('title') && getFieldError('title');

		const prefixType = getFieldDecorator('type', {
			initialValue: type ? type + '' : '1'
		})(
			<Select>
				<Option value="1">原创</Option>
				<Option value="2">转载</Option>
				<Option value="3">翻译</Option>
			</Select>
		);

		return (
			<Form layout="inline" onSubmit={this.handleSubmit}>
				<FormItem
					validateStatus={titleError ? 'error' : ''}
					help={titleError || ''}
					label="文章标题"
				>
				{
					getFieldDecorator('title', {
						initialValue: title,
						rules: [{required: true, message: 'Please input title!'}]
					})(
						<Input addonBefore={prefixType} placeholder="title" style={{width: 290}}/>
					)
				}
				</FormItem>
				<FormItem
					validateStatus={tagError ? 'error' : ''}
					help={tagError || ''}
					label="文章标签"
				>
				{
					getFieldDecorator('tag', {
						initialValue: tag,
						rules: [{required: true, message: 'Please input tag!'}]
					})(
						<Input placeholder="tag" style={{width: 160}}/>
					)
				}
				</FormItem>
				<FormItem label="文章分类">
				{
					getFieldDecorator('category', {
						initialValue: category ? category + '' : '1'
					})(
						<Select style={{width: 100}}>
							{
								this.state.categories.map((item) => (
									<Option key={item.id} value={item.id + ''}>{item.theme}</Option>
								))
							}
						</Select>
					)
				}
				</FormItem>
				{
					this.props.id != null ? '' :
					<FormItem label="文章格式">
					{
						getFieldDecorator('markdown', {
							initialValue: markdown ? markdown + '' : '0'
						})(
							<Select style={{width: 90}} onChange={this.handleTypeChange}>
								<Option value='0'>富文本</Option>
								<Option value='1'>Markdown</Option>
							</Select>
						)
					}
					</FormItem>
				}
				{
					markdown === '1' ?
					<FormItem>
						<Checkbox onChange={this.handlePreview} checked={preview ? true : false}>开启预览</Checkbox>
					</FormItem>
					:
					''
				}
				{
					this.props.id && !title ?
					null
					:
					markdown === '0' ?
                        <Editor
                            editorState={editorState}
                            wrapperClassName="demo-wrapper"
                            editorClassName="demo-editor"
                            onEditorStateChange={this.onEditorStateChange}
                            toolbar={{
                              inline: { inDropdown: true },
                              list: { inDropdown: true },
                              textAlign: { inDropdown: true },
                              link: { inDropdown: true },
                              history: { inDropdown: true },
                              image: { uploadCallback: this.uploadImageCallBack, alt: { present: true, mandatory: true } },
                            }}
                        />
					:
						<Markdown
							content={content}
							onChange={this.handleChange}
							preview={preview}
						/>
				}
				<div style={{textAlign: "right"}}>
					<FormItem>
						<Button type="primary" htmlType="submit">
							提交
						</Button>
					</FormItem>
				</div>
			</Form>
		)
	}
}

const WrappedArticleDetail = Form.create()(ArticleDetail);

export default WrappedArticleDetail;
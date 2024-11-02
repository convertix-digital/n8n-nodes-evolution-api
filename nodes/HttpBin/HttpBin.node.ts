import { INodeType, INodeTypeDescription, IExecuteFunctions, INodeExecutionData, IRequestOptions, IHttpRequestMethods, NodeApiError } from 'n8n-workflow';
import { httpVerbFields, httpVerbOperations } from './HttpVerbDescription';
// Observação deste documento:
// Este documento serve para a realizar as requisições do node
// Utilizando os campos definidos no HttpVerbDescription.ts

export class HttpBin implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Evolution API',
		name: 'httpBin',
		icon: 'file:evolutionapi.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Evolution API',
		defaults: {
			name: 'Evolution API',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'httpbinApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://doc.evolution-api.com/api-reference',
			url: '',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Recurso',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Instancia',
						value: 'instances-api',
					},
					{
						name: 'Mensagem',
						value: 'messages-api',
					},
					{
						name: 'Evento',
						value: 'events-api',
					},
					{
						name: 'Integração',
						value: 'integrations-api',
					},
				],
				default: 'instances-api',
			},
			...httpVerbOperations,
			...httpVerbFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		let responseData;

		// Criar instancia basica
		if (resource === 'instances-api' && operation === 'instance-basic') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const token = this.getNodeParameter('token', 0) || '';
			const number = this.getNodeParameter('number', 0) || '';

			// Inicializa o corpo básico da requisição
			const body: any = {
				instanceName,
				integration: 'WHATSAPP-BAILEYS',
			};

			if (token) {
				body.token = token;
			}
			if (number) {
				body.number = number;
			}

			// Verifica e adiciona configurações da instância se existirem
			const instanceSettings = this.getNodeParameter('options_Create_instance.instanceSettings.settings', 0, {}) as {
				rejectCall?: boolean;
				msgCall?: string;
				groupsIgnore?: boolean;
				alwaysOnline?: boolean;
				readMessages?: boolean;
				readStatus?: boolean;
				syncFullHistory?: boolean;
			};
			if (instanceSettings && Object.keys(instanceSettings).length > 0) {
				Object.assign(body, instanceSettings);
			}

			// Verifica e adiciona configurações de proxy se existirem
			const proxySettings = this.getNodeParameter('options_Create_instance.proxy.proxySettings', 0, {}) as {
				proxyHost?: string;
				proxyPort?: number;
				proxyProtocol?: string;
				proxyUsername?: string;
				proxyPassword?: string;
			};
			if (proxySettings && Object.keys(proxySettings).length > 0) {
				Object.assign(body, {
					proxyHost: proxySettings.proxyHost || "",
					proxyPort: proxySettings.proxyPort ? String(proxySettings.proxyPort) : "1234", // Converte para string
					proxyProtocol: proxySettings.proxyProtocol || "",
					proxyUsername: proxySettings.proxyUsername || "",
					proxyPassword: proxySettings.proxyPassword || "",
				});
			}

			// Verifica e adiciona configurações do Webhook se existirem
			const webhookSettings = this.getNodeParameter('options_Create_instance.webhook.webhookSettings', 0, {}) as {
				webhookUrl?: string;
				webhookByEvents?: boolean;
				webhookBase64?: boolean;
				webhookEvents?: string[];
			};

			if (webhookSettings && Object.keys(webhookSettings).length > 0) {
				Object.assign(body, {
					  'webhook': {
							url: webhookSettings.webhookUrl || "",
							byEvents: webhookSettings.webhookByEvents || false,
							base64: webhookSettings.webhookBase64 || false,
							events: webhookSettings.webhookEvents || [],
						}
				});
			}

			// Verifica e adiciona configurações do RabbitMQ se existirem
			const rabbitmqSettings = this.getNodeParameter('options_Create_instance.rabbitmq.rabbitmqSettings', 0, {}) as {
				rabbitmqEnabled?: boolean;
				rabbitmqEvents?: string[];
			};

			if (rabbitmqSettings && Object.keys(rabbitmqSettings).length > 0) {
				Object.assign(body, {
						'rabbitmq': {
							enabled: rabbitmqSettings.rabbitmqEnabled || false,
							events: rabbitmqSettings.rabbitmqEvents || [],
						}
				});
			}

			// Verifica e adiciona configurações do Chatwoot se existirem
			const chatwootSettings = this.getNodeParameter('options_Create_instance.chatwoot.chatwootSettings', 0, {}) as {
				chatwootAccountId?: number;
				chatwootToken?: string;
				chatwootUrl?: string;
				chatwootSignMsg?: boolean;
				chatwootReopenConversation?: boolean;
				chatwootConversationPending?: boolean;
				chatwootImportContacts?: boolean;
				chatwootNameInbox?: string;
				chatwootMergeBrazilContacts?: boolean;
				chatwootImportMessages?: boolean;
				chatwootDaysLimitImportMessages?: number;
				chatwootOrganization?: string;
				chatwootLogo?: string;
			};

			// Adiciona todos os campos do Chatwoot
			body.chatwootAccountId = chatwootSettings.chatwootAccountId || '';
			body.chatwootToken = chatwootSettings.chatwootToken || '';
			body.chatwootUrl = chatwootSettings.chatwootUrl || '';
			body.chatwootSignMsg = chatwootSettings.chatwootSignMsg !== undefined ? chatwootSettings.chatwootSignMsg : false;
			body.chatwootReopenConversation = chatwootSettings.chatwootReopenConversation || false;
			body.chatwootConversationPending = chatwootSettings.chatwootConversationPending || false;
			body.chatwootImportContacts = chatwootSettings.chatwootImportContacts || false;
			body.chatwootNameInbox = chatwootSettings.chatwootNameInbox || '';
			body.chatwootMergeBrazilContacts = chatwootSettings.chatwootMergeBrazilContacts || false;
			body.chatwootImportMessages = chatwootSettings.chatwootImportMessages || false;
			body.chatwootDaysLimitImportMessages = chatwootSettings.chatwootDaysLimitImportMessages || 0;
			body.chatwootOrganization = chatwootSettings.chatwootOrganization || '';
			body.chatwootLogo = chatwootSettings.chatwootLogo || '';

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/instance/create`,
				body,
				json: true,
			};

			responseData = await this.helpers.request(options);
		}

		// Conectar Instância
		if (resource === 'instances-api' && operation === 'instance-connect') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);

			const options: IRequestOptions = {
				method: 'GET' as IHttpRequestMethods,
				headers: {
					apikey: apiKey,
				},
				uri: `${serverUrl}/instance/connect/${instanceName}`,
				json: true,
			};

			responseData = await this.helpers.request(options);
		}

		// Reiniciar Instancia
		if (resource === 'instances-api' && operation === 'restart-instance') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					apikey: apiKey,
				},
				uri: `${serverUrl}/instance/restart/${instanceName}`,
				json: true,
			};

			responseData = await this.helpers.request(options);
		}

		// Desconectar instancia
		if (resource === 'instances-api' && operation === 'logout-instance') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);

			const options: IRequestOptions = {
				method: 'DELETE' as IHttpRequestMethods,
				headers: {
					apikey: apiKey,
				},
				uri: `${serverUrl}/instance/logout/${instanceName}`,
				json: true,
			};

			responseData = await this.helpers.request(options);
		}

		// Definir presença
		if (resource === 'instances-api' && operation === 'setPresence') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const presence = this.getNodeParameter('presence', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/instance/setPresence/${instanceName}`,
				body: {
					presence: presence,
				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Deletar instancia
		if (resource === 'instances-api' && operation === 'delete-instance') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);

			const options: IRequestOptions = {
				method: 'DELETE' as IHttpRequestMethods,
				headers: {
					apikey: apiKey,
				},
				uri: `${serverUrl}/instance/delete/${instanceName}`,
				json: true,
			};

			responseData = await this.helpers.request(options);
		}

		// Buscar Instancia
		if (resource === 'instances-api' && operation === 'fetch-instances') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);

			const options: IRequestOptions = {
				method: 'GET' as IHttpRequestMethods,
				headers: {
					apikey: apiKey,
				},
				uri: `${serverUrl}/instance/fetchInstances${instanceName ? `?instanceName=${instanceName}` : ''}`,
				json: true,
			};

			responseData = await this.helpers.request(options);
		}

		// Confiturações da instancia
		if (resource === 'instances-api' && operation === 'instanceSettings') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const rejectCall = this.getNodeParameter('rejectCall', 0);
			const msgCall = this.getNodeParameter('msgCall', 0) || ''; // Define um valor padrão
			const groupsIgnore = this.getNodeParameter('groupsIgnore', 0);
			const alwaysOnline = this.getNodeParameter('alwaysOnline', 0);
			const readMessages = this.getNodeParameter('readMessages', 0);
			const syncFullHistory = this.getNodeParameter('syncFullHistory', 0);
			const readStatus = this.getNodeParameter('readStatus', 0);

			const body: any = {
				rejectCall,
				msgCall: msgCall || '',
				groupsIgnore,
				alwaysOnline,
				readMessages,
				syncFullHistory,
				readStatus,
			};

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/settings/set/${instanceName}`,
				body,
				json: true,
			};
			responseData = await this.helpers.request(options);
			// Adiciona msgCall apenas se rejectCall for true
			if (rejectCall) {
				body.msgCall = msgCall || '';
			}
		}

		// Enviar mensagem de texto
		if (resource === 'messages-api' && operation === 'sendText') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const remoteJid = this.getNodeParameter('remoteJid', 0);
			const messageText = this.getNodeParameter('messageText', 0);
			const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);
					const delay = this.getNodeParameter('delay', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/message/sendText/${instanceName}`,
				body: {
					number: remoteJid,
					text: messageText,
					mentionsEveryOne: mentionsEveryOne,
					delay: delay,
				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Enviar mensagem de imagem
		if (resource === 'messages-api' && operation === 'sendImage') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const remoteJid = this.getNodeParameter('remoteJid', 0);
			const media = this.getNodeParameter('media', 0);
			// const mimetype = this.getNodeParameter('mimetype', 0);
			const caption = this.getNodeParameter('caption', 0);
			// const fileName = this.getNodeParameter('fileName', 0);
			const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);
			const delay = this.getNodeParameter('delay', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/message/sendMedia/${instanceName}`,
				body: {
					number: remoteJid,
					'mediatype': 'image',
					media: media,
					'mimetype': '',
					caption: caption,
					'fileName': '',
					mentionsEveryOne: mentionsEveryOne,
					delay: delay,

				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Enviar mensagem de Figurinha
		if (resource === 'messages-api' && operation === 'sendImage') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const remoteJid = this.getNodeParameter('remoteJid', 0);
			const sticker = this.getNodeParameter('sticker', 0);
			const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);
			const delay = this.getNodeParameter('delay', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/message/sendMedia/${instanceName}`,
				body: {
					number: remoteJid,
					sticker: sticker,
					mentionsEveryOne: mentionsEveryOne,
					delay: delay,
				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Enviar mensagem de video
		if (resource === 'messages-api' && operation === 'sendVideo') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const remoteJid = this.getNodeParameter('remoteJid', 0);
			const media = this.getNodeParameter('media', 0);
			// const mimetype = this.getNodeParameter('mimetype', 0);
			const caption = this.getNodeParameter('caption', 0);
			// const fileName = this.getNodeParameter('fileName', 0);
			const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);
			const delay = this.getNodeParameter('delay', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/message/sendMedia/${instanceName}`,
				body: {
					number: remoteJid,
					'mediatype': 'video',
					media: media,
					'mimetype': '',
					caption: caption,
					'fileName': '',
					mentionsEveryOne: mentionsEveryOne,
					delay: delay,
				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Enviar mensagem de audio
		if (resource === 'messages-api' && operation === 'sendAudio') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const remoteJid = this.getNodeParameter('remoteJid', 0);
			const media = this.getNodeParameter('media', 0);
			const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);
			const delay = this.getNodeParameter('delay', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/message/sendWhatsAppAudio/${instanceName}`,
				body: {
					number: remoteJid,
					audio: media,
					mentionsEveryOne: mentionsEveryOne,
					delay: delay,
				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Enviar mensagem de documento
		if (resource === 'messages-api' && operation === 'sendDocumento') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const remoteJid = this.getNodeParameter('remoteJid', 0);
			const media = this.getNodeParameter('media', 0);
			const caption = this.getNodeParameter('caption', 0);
			// const fileName = this.getNodeParameter('fileName', 0);
			const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);
					delay: delay,

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/message/sendMedia/${instanceName}`,
				body: {
					number: remoteJid,
					'mediatype': 'document',
					media: media,
					caption: caption,
					'fileName': '',
					mentionsEveryOne: mentionsEveryOne,
					delay: delay,
				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Enviar Enquete
		if (resource === 'messages-api' && operation === 'sendPoll') {
			try {
					const credentials = await this.getCredentials('httpbinApi');
					const serverUrl = credentials['server-url'];
					const apiKey = credentials.apikey;

					const instanceName = this.getNodeParameter('instanceName', 0);
					const remoteJid = this.getNodeParameter('remoteJid', 0);
					const pollTitle = this.getNodeParameter('caption', 0);
					const options = this.getNodeParameter('options_display.metadataValues', 0) as { optionValue: string }[];
					const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);
					const delay = this.getNodeParameter('delay', 0);

					// Verifica se options é um array e não está vazio
					const pollOptions = Array.isArray(options) ? options.map(option => option.optionValue) : [];

					const requestOptions: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									'Content-Type': 'application/json',
									apikey: apiKey,
							},
							uri: `${serverUrl}/message/sendPoll/${instanceName}`,
							body: {
									number: remoteJid,
									name: pollTitle,
									selectableCount: 1,
									mentionsEveryOne: mentionsEveryOne,
									delay: delay,
									values: pollOptions,
							},
							json: true,
					};

					responseData = await this.helpers.request(requestOptions);
			} catch (error) {
					// console.error('Erro ao enviar a enquete:', error);
					throw new NodeApiError(this.getNode(), error); // Substitua aqui
			}
		}

		// Enviar Template
		if (resource === 'messages-api' && operation === 'sendTemplate') {
			try {
					const credentials = await this.getCredentials('httpbinApi');
					const serverUrl = credentials['server-url'];
					const apiKey = credentials.apikey;

					const instanceName = this.getNodeParameter('instanceName', 0);
					const remoteJid = this.getNodeParameter('remoteJid', 0);
					const templateHeader = this.getNodeParameter('templateHeader', 0);
					const templateBody = this.getNodeParameter('templateBody', 0);
					const templateButton = this.getNodeParameter('templateButton', 0);
					const params = this.getNodeParameter('templateparams_display.metadataValues', 0) as { typeValue: string, textValue: string }[];
					const mentionsEveryOne = this.getNodeParameter('mentionsEveryOne', 0);

					// Verifica se options é um array e não está vazio
					const templateParams = Array.isArray(params) ? params.map(type => type.typeValue, text => text.textValue) : [];

					const requestOptions: IRequestOptions = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									'Content-Type': 'application/json',
									apikey: apiKey,
							},
							uri: `${serverUrl}/message/sendTemplate/${instanceName}`,
							body: {
									number: remoteJid,
									name: templateTitle,
									components: [
											    {
											      type: templateType,
											      sub_type: templateSub_type,
											      index: templateIndex,
											      parameters: templateParams
											    }
											  ]
									selectableCount: 1,
									mentionsEveryOne: mentionsEveryOne,
							},
							json: true,
					};

					responseData = await this.helpers.request(requestOptions);
			} catch (error) {
					// console.error('Erro ao enviar a enquete:', error);
					throw new NodeApiError(this.getNode(), error); // Substitua aqui
			}
		}


		// Enviar status
		if (resource === 'messages-api' && operation === 'sendStories') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;
			const instanceName = this.getNodeParameter('instanceName', 0);
			const type = this.getNodeParameter('type', 0);
			const content = this.getNodeParameter('content', 0);
			const caption = this.getNodeParameter('caption', 0);
			const backgroundColor = this.getNodeParameter('backgroundColor', 0);
			const font = this.getNodeParameter('font', 0);

			const options: IRequestOptions = {
				method: 'POST' as IHttpRequestMethods,
				headers: {
					'Content-Type': 'application/json',
					apikey: apiKey,
				},
				uri: `${serverUrl}/message/sendStatus/${instanceName}`,
				body: {
					type: type,
					content: content,
					caption: caption,
					backgroundColor: backgroundColor,
					font: font,
					'allContacts': true,
				},
				json: true,
			};
			responseData = await this.helpers.request(options);
		}

		// Definir/Buscar Webhook
		if (resource === 'events-api' && operation === 'webhook') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForWebhook = this.getNodeParameter('resourceForWebhook', 0);

			let options: IRequestOptions; // Declare a variável antes de usá-la

			if (resourceForWebhook === 'setWebhook') {
				// Configurações do Webhook
				const enabled = this.getNodeParameter('enabled', 0);
				const webhookUrl = this.getNodeParameter('webhookUrl', 0) || 'vazio';
				const webhookByEvents = this.getNodeParameter('webhookByEvents', 0);
				const webhookBase64 = this.getNodeParameter('webhookBase64', 0);
				const webhookEvents = this.getNodeParameter('webhookEvents', 0) || [];

				const body = {
					'webhook': {
						enabled: enabled,
						url: webhookUrl,
						webhookByEvents,
						webhookBase64,
						events: webhookEvents,
					}
				};

				options = {
					method: 'POST' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/webhook/set/${instanceName}`,
					body,
					json: true,
				};
			} else if (resourceForWebhook === 'findWebhook') {
				options = {
					method: 'GET' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/webhook/find/${instanceName}`,
					json: true,
				};
			} else {
				throw new NodeApiError(this.getNode(), {
					message: 'Operação de webhook não reconhecida.',
					description: 'A operação solicitada não é válida para o recurso de webhook.',
			});
		}
			responseData = await this.helpers.request(options);
		}

		// Definir/Buscar RabbitMQ
		if (resource === 'events-api' && operation === 'rabbitMQ') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForRabbitMQ = this.getNodeParameter('resourceForRabbitMQ', 0);

			let options: IRequestOptions; // Declare a variável antes de usá-la

			if (resourceForRabbitMQ === 'setRabbitMQ') {
				// Configurações do RabbitMQ
				const enabled = this.getNodeParameter('enabled', 0);
				const rabbitMQEvents = this.getNodeParameter('rabbitMQEvents', 0) || [];

				const body = {
					'rabbitmq': {
						enabled: enabled,
						events: rabbitMQEvents,
					}
				};

				options = {
					method: 'POST' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/rabbitmq/set/${instanceName}`,
					body,
					json: true,
				};
			} else if (resourceForRabbitMQ === 'findRabbitMQ') {
				options = {
					method: 'GET' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/rabbitmq/find/${instanceName}`,
					json: true,
				};
			} else {
				throw new NodeApiError(this.getNode(), {
					message: 'Operação de RabbitMQ não reconhecida.',
					description: 'A operação solicitada não é válida para o recurso de RabbitMQ.',
			});
		}
			responseData = await this.helpers.request(options);
		}

		// Definir/Buscar Chatwoot
		if (resource === 'integrations-api' && operation === 'chatwoot') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForChatwoot = this.getNodeParameter('resourceForChatwoot', 0);

			let options: IRequestOptions;

			if (resourceForChatwoot === 'setChatwoot') {
				// Configurações do Chatwoot
				const enabled = this.getNodeParameter('enabled', 0) as boolean;
				const chatwootAccountId = this.getNodeParameter('chatwootAccountId', 0) as number;
				const chatwootToken = this.getNodeParameter('chatwootToken', 0) as string;
				const chatwootUrl = this.getNodeParameter('chatwootUrl', 0) as string;
				const chatwootSignMsg = this.getNodeParameter('chatwootSignMsg', 0) as boolean;
				const chatwootReopenConversation = this.getNodeParameter('chatwootReopenConversation', 0) as boolean;
				const chatwootConversationPending = this.getNodeParameter('chatwootConversationPending', 0) as boolean;
				const chatwootImportContacts = this.getNodeParameter('chatwootImportContacts', 0) as boolean;
				const chatwootNameInbox = this.getNodeParameter('chatwootNameInbox', 0) as string;
				const chatwootMergeBrazilContacts = this.getNodeParameter('chatwootMergeBrazilContacts', 0) as boolean;
				const chatwootImportMessages = this.getNodeParameter('chatwootImportMessages', 0) as boolean;
				const chatwootAutoCreate = this.getNodeParameter('chatwootAutoCreate', 0) as boolean;
				const chatwootDaysLimitImportMessages = this.getNodeParameter('chatwootDaysLimitImportMessages', 0) as number;
				const chatwootOrganization = this.getNodeParameter('chatwootOrganization', 0) as string;
				const chatwootLogo = this.getNodeParameter('chatwootLogo', 0, 'https://github.com/user-attachments/assets/4d1e9cd6-377a-4383-820a-9a97e6cfbb63') as string;

				const body = {
					enabled: enabled,
					accountId: chatwootAccountId,
					token: chatwootToken,
					url: chatwootUrl,
					signMsg: chatwootSignMsg,
					reopenConversation: chatwootReopenConversation,
					conversationPending: chatwootConversationPending,
					nameInbox: chatwootNameInbox,
					mergeBrazilContacts: chatwootMergeBrazilContacts,
					importContacts: chatwootImportContacts,
					importMessages: chatwootImportMessages,
					daysLimitImportMessages: chatwootDaysLimitImportMessages,
					'signDelimiter': '\n',
					autoCreate: chatwootAutoCreate,
					organization: chatwootOrganization,
					logo: chatwootLogo,
				};

				options = {
					method: 'POST' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/chatwoot/set/${instanceName}`,
					body,
					json: true,
				};
			} else if (resourceForChatwoot === 'findChatwoot') {
				options = {
					method: 'GET' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/chatwoot/find/${instanceName}`,
					json: true,
				};
			} else {
				throw new NodeApiError(this.getNode(), {
					message: 'Operação de Chatwoot não reconhecida.',
					description: 'A operação solicitada não é válida para o recurso de Chatwoot.',
				});
			}

			responseData = await this.helpers.request(options);
		}

		// Definir/Buscar Proxy
		if (resource === 'instances-api' && operation === 'proxy') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForProxy = this.getNodeParameter('resourceForProxy', 0);

			let options: IRequestOptions; // Declare a variável antes de usá-la

			if (resourceForProxy === 'setProxy') {
				// Configurações do Proxy
				const enabled = this.getNodeParameter('enabled', 0) || '';
				const proxyHost = this.getNodeParameter('proxyHost', 0) || "1234";
				const proxyPort = this.getNodeParameter('proxyPort', 0) || '';
				const proxyProtocol = this.getNodeParameter('proxyProtocol', 0) || '';
				const proxyUsername = this.getNodeParameter('proxyUsername', 0) || '';
				const proxyPassword = this.getNodeParameter('proxyPassword', 0) || '';

				const body = {
					enabled: enabled,
					host: proxyHost,
					port: proxyPort,
					protocol: proxyProtocol,
					username: proxyUsername,
					password: proxyPassword,
				};

				options = {
					method: 'POST' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/proxy/set/${instanceName}`,
					body,
					json: true,
				};
			} else if (resourceForProxy === 'findProxy') {
				options = {
					method: 'GET' as IHttpRequestMethods,
					headers: {
						apikey: apiKey,
					},
					uri: `${serverUrl}/proxy/find/${instanceName}`,
					json: true,
				};
			} else {
				throw new NodeApiError(this.getNode(), {
					message: 'Operação de Proxy não reconhecida.',
					description: 'A operação solicitada não é válida para o recurso de Proxy.',
			});
		}

			responseData = await this.helpers.request(options);
		}

		// Definir/Buscar Typebot
		if (resource === 'integrations-api' && operation === 'typebot') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForTypebot = this.getNodeParameter('resourceForTypebot', 0);

			let options: IRequestOptions;

			if (resourceForTypebot === 'createTypebot') {
					const url = this.getNodeParameter('url', 0) as string;
					const typebot = this.getNodeParameter('typebot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							url,
							typebot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/typebot/create/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForTypebot === 'findTypebot') {
					const typebotId = this.getNodeParameter('typebotId', 0) as string;

					if (typebotId) {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/typebot/fetch/${typebotId}/${instanceName}`,
									json: true,
							};
					} else {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/typebot/find/${instanceName}`,
									json: true,
							};
					}
			} else if (resourceForTypebot === 'updateTypebot') {
					const typebotId = this.getNodeParameter('typebotId', 0) as string;
					const url = this.getNodeParameter('url', 0) as string;
					const typebot = this.getNodeParameter('typebot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							url,
							typebot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'PUT' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/typebot/update/${typebotId}/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForTypebot === 'deleteTypebot') {
					const typebotId = this.getNodeParameter('typebotId', 0) as string;

					options = {
							method: 'DELETE' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/typebot/delete/${typebotId}/${instanceName}`,
							json: true,
					};
			} else if (resourceForTypebot === 'startTypebot') {
					const url = this.getNodeParameter('url', 0) as string;
					const typebot = this.getNodeParameter('typebot', 0) as string;
					const remoteJid = this.getNodeParameter('remoteJid', 0) as string;
					const startSession = this.getNodeParameter('startSession', 0) as boolean;

					const body: any = {
							url,
							typebot,
							remoteJid,
							startSession,
					};

					const variablesDisplay = this.getNodeParameter('variables_display', 0) as { metadataValues: { name: string; value: string }[] };
					if (variablesDisplay.metadataValues.length > 0) {
							body.variables = variablesDisplay.metadataValues.map(variable => ({
									name: variable.name,
									value: variable.value,
							}));
					}

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/typebot/start/${instanceName}`,
							body,
							json: true,
					};
				} else if (resourceForTypebot === 'fetchSessionsTypebot') {
					const typebotId = this.getNodeParameter('typebotId', 0) as string;

					options = {
						method: 'GET' as IHttpRequestMethods,
						headers: {
							apikey: apiKey,
						},
						uri: `${serverUrl}/typebot/fetchSessions/${typebotId}/${instanceName}`,
						json: true,
					};
				} else if (resourceForTypebot === 'changeStatusTypebot') {
					const remoteJid = this.getNodeParameter('remoteJid', 0) as string;
					const status = this.getNodeParameter('status', 0) as string;

					options = {
						method: 'POST' as IHttpRequestMethods,
						headers: {
							apikey: apiKey,
						},
						uri: `${serverUrl}/typebot/changeStatus/${instanceName}`,
						body: {
							remoteJid,
							status,
						},
						json: true,
					};
				} else {
					// console.error('Operação de Typebot não reconhecida:', resourceForTypebot); // Adiciona log no console
					throw new NodeApiError(this.getNode(), {
							message: 'Erro na requisição.',
							description: `Verifique se você preencheu todos os campos... Segue o erro: ${resourceForTypebot}.`,
					});
			}

			responseData = await this.helpers.request(options);
		}

		//EvolutionBot
		// Definir/Buscar Evolution Bot
		if (resource === 'integrations-api' && operation === 'evolutionBot') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForEvolutionBot = this.getNodeParameter('resourceForEvolutionBot', 0);

			let options: IRequestOptions | undefined;

			if (resourceForEvolutionBot === 'createEvolutionBot') {
					const apiUrl = this.getNodeParameter('apiUrl', 0) as string;
					const apiKeyBot = this.getNodeParameter('apiKeyBot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							apiUrl,
							'apiKey': apiKeyBot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/evolutionBot/create/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForEvolutionBot === 'findEvolutionBot') {
					const evolutionBotId = this.getNodeParameter('evolutionBotId', 0) as string;

					if (evolutionBotId) {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/evolutionBot/fetch/${evolutionBotId}/${instanceName}`,
									json: true,
							};
					} else {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/evolutionBot/find/${instanceName}`,
									json: true,
							};
					}
			} else if (resourceForEvolutionBot === 'updateEvolutionBot') {
					const evolutionBotId = this.getNodeParameter('evolutionBotId', 0) as string;
					const apiUrl = this.getNodeParameter('apiUrl', 0) as string;
					const apiKeyBot = this.getNodeParameter('apiKeyBot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							apiUrl,
							'apiKey': apiKeyBot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'PUT' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/evolutionBot/update/${evolutionBotId}/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForEvolutionBot === 'deleteEvolutionBot') {
					const evolutionBotId = this.getNodeParameter('evolutionBotId', 0) as string;

					options = {
							method: 'DELETE' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/evolutionBot/delete/${evolutionBotId}/${instanceName}`,
							json: true,
					};
			} else if (resourceForEvolutionBot === 'fetchSessionsEvolutionBot') {
					const evolutionBotId = this.getNodeParameter('evolutionBotId', 0) as string;

					options = {
							method: 'GET' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/evolutionBot/fetchSessions/${evolutionBotId}/${instanceName}`,
							json: true,
					};
			} else if (resourceForEvolutionBot === 'changeStatusEvolutionBot') {
					const remoteJid = this.getNodeParameter('remoteJid', 0) as string;
					const status = this.getNodeParameter('status', 0) as string;

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/evolutionBot/changeStatus/${instanceName}`,
							body: {
									remoteJid,
									status,
							},
							json: true,
					};
				} else {
					throw new NodeApiError(this.getNode(), {
						message: 'Operação de Evolution Bot não reconhecida.',
						description: 'A operação solicitada não é válida para o recurso de Evolution Bot.',
					});
				}

				if (options) { // Verifique se options foi inicializado
					responseData = await this.helpers.request(options);
				} else {
					throw new NodeApiError(this.getNode(), {
						message: 'Nenhuma opção de requisição foi definida.',
						description: 'Verifique a operação solicitada.',
					});
				}
			}

		// Dify
		if (resource === 'integrations-api' && operation === 'difyBot') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForDifyBot = this.getNodeParameter('resourceForDifyBot', 0);

			let options: IRequestOptions | undefined;

			if (resourceForDifyBot === 'createDify') {
					const botType = this.getNodeParameter('botType', 0) as string;
					const apiUrl = this.getNodeParameter('apiUrl', 0) as string;
					const apiKeyBot = this.getNodeParameter('apiKeyBot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							botType,
							apiUrl,
							apiKey: apiKeyBot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/dify/create/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForDifyBot === 'findDify') {
					const difyBotId = this.getNodeParameter('difyBotId', 0) as string;

					if (difyBotId) {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/dify/fetch/${difyBotId}/${instanceName}`,
									json: true,
							};
					} else {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/dify/find/${instanceName}`,
									json: true,
							};
					}
			} else if (resourceForDifyBot === 'updateDify') {
					const difyBotId = this.getNodeParameter('difyBotId', 0) as string;
					const botType = this.getNodeParameter('botType', 0) as string;
					const apiUrl = this.getNodeParameter('apiUrl', 0) as string;
					const apiKeyBot = this.getNodeParameter('apiKeyBot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							botType,
							apiUrl,
							apiKey: apiKeyBot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'PUT' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/dify/update/${difyBotId}/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForDifyBot === 'deleteDify') {
					const difyBotId = this.getNodeParameter('difyBotId', 0) as string;

					options = {
							method: 'DELETE' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/dify/delete/${difyBotId}/${instanceName}`,
							json: true,
					};
			} else if (resourceForDifyBot === 'fetchSessionsDify') {
					const difyBotId = this.getNodeParameter('difyBotId', 0) as string;

					options = {
							method: 'GET' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/dify/fetchSessions/${difyBotId}/${instanceName}`,
							json: true,
					};
			} else if (resourceForDifyBot === 'changeStatusDify') {
					const remoteJid = this.getNodeParameter('remoteJid', 0) as string;
					const status = this.getNodeParameter('status', 0) as string;

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/dify/changeStatus/${instanceName}`,
							body: {
									remoteJid,
									status,
							},
							json: true,
					};
			} else {
					throw new NodeApiError(this.getNode(), {
							message: 'Operação de Dify não reconhecida.',
							description: 'A operação solicitada não é válida para o recurso de Dify.',
					});
			}

			if (options) {
					responseData = await this.helpers.request(options);
			} else {
					throw new NodeApiError(this.getNode(), {
							message: 'Nenhuma opção de requisição foi definida.',
							description: 'Verifique a operação solicitada.',
					});
			}
		}

		// Flowise
		if (resource === 'integrations-api' && operation === 'flowiseBot') {
			const credentials = await this.getCredentials('httpbinApi');
			const serverUrl = credentials['server-url'];
			const apiKey = credentials.apikey;

			const instanceName = this.getNodeParameter('instanceName', 0);
			const resourceForFlowiseBot = this.getNodeParameter('resourceForFlowiseBot', 0);

			let options: IRequestOptions | undefined;

			if (resourceForFlowiseBot === 'createFlowise') {
					const apiUrl = this.getNodeParameter('apiUrl', 0) as string;
					const apiKeyBot = this.getNodeParameter('apiKeyBot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							apiUrl,
							apiKey: apiKeyBot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/flowise/create/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForFlowiseBot === 'findFlowise') {
					const flowiseBotId = this.getNodeParameter('flowiseBotId', 0) as string;

					if (flowiseBotId) {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/flowise/fetch/${flowiseBotId}/${instanceName}`,
									json: true,
							};
					} else {
							options = {
									method: 'GET' as IHttpRequestMethods,
									headers: {
											apikey: apiKey,
									},
									uri: `${serverUrl}/flowise/find/${instanceName}`,
									json: true,
							};
					}
			} else if (resourceForFlowiseBot === 'updateFlowise') {
					const flowiseBotId = this.getNodeParameter('flowiseBotId', 0) as string;
					const apiUrl = this.getNodeParameter('apiUrl', 0) as string;
					const apiKeyBot = this.getNodeParameter('apiKeyBot', 0) as string;
					const triggerType = this.getNodeParameter('triggerType', 0) as string;

					const body: any = {
							enabled: true,
							apiUrl,
							apiKey: apiKeyBot,
							triggerType,
					};

					if (triggerType === 'keyword') {
							const triggerOperator = this.getNodeParameter('triggerOperator', 0) as string;
							const triggerValue = this.getNodeParameter('triggerValue', 0) as string;
							body.triggerOperator = triggerOperator;
							body.triggerValue = triggerValue;
					}

					// Campos adicionais
					body.keywordFinish = this.getNodeParameter('keywordFinish', 0) || '';
					body.delayMessage = this.getNodeParameter('delayMessage', 0) || 1000;
					body.unknownMessage = this.getNodeParameter('unknownMessage', 0) || 'Mensagem não reconhecida';
					body.listeningFromMe = this.getNodeParameter('listeningFromMe', 0) || false;
					body.stopBotFromMe = this.getNodeParameter('stopBotFromMe', 0) || false;
					body.keepOpen = this.getNodeParameter('keepOpen', 0) || false;
					body.debounceTime = this.getNodeParameter('debounceTime', 0) || 0;

					options = {
							method: 'PUT' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/flowise/update/${flowiseBotId}/${instanceName}`,
							body,
							json: true,
					};
			} else if (resourceForFlowiseBot === 'deleteFlowise') {
					const flowiseBotId = this.getNodeParameter('flowiseBotId', 0) as string;

					options = {
							method: 'DELETE' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/flowise/delete/${flowiseBotId}/${instanceName}`,
							json: true,
					};
			} else if (resourceForFlowiseBot === 'fetchSessionsFlowise') {
					const flowiseBotId = this.getNodeParameter('flowiseBotId', 0) as string;

					options = {
							method: 'GET' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/flowise/fetchSessions/${flowiseBotId}/${instanceName}`,
							json: true,
					};
			} else if (resourceForFlowiseBot === 'changeStatusFlowise') {
					const remoteJid = this.getNodeParameter('remoteJid', 0) as string;
					const status = this.getNodeParameter('status', 0) as string;

					options = {
							method: 'POST' as IHttpRequestMethods,
							headers: {
									apikey: apiKey,
							},
							uri: `${serverUrl}/flowise/changeStatus/${instanceName}`,
							body: {
									remoteJid,
									status,
							},
							json: true,
					};
			} else {
					throw new NodeApiError(this.getNode(), {
							message: 'Operação de Flowise não reconhecida.',
							description: 'A operação solicitada não é válida para o recurso de Flowise.',
					});
			}

			if (options) {
					responseData = await this.helpers.request(options);
			} else {
					throw new NodeApiError(this.getNode(), {
							message: 'Nenhuma opção de requisição foi definida.',
							description: 'Verifique a operação solicitada.',
					});
			}
		}


		// Retornar apenas o JSON
		return [this.helpers.returnJsonArray(responseData)];
	}
}

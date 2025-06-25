const fetch = require('node-fetch');
exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method Not Allowed' }) 
        };
    }
    const DISCORD_DARKWEB_WEBHOOK = process.env.DISCORD_DARKWEB_WEBHOOK;
    if (!DISCORD_DARKWEB_WEBHOOK) {
        console.error('DISCORD_DARKWEB_WEBHOOK environment variable not set.');
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Webhook URL not configured.' }) 
        };
    }
    try {
        const data = JSON.parse(event.body);
        if (!data.type || !data.contactData || !data.accessConfig) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Données manquantes: type, contactData et accessConfig sont requis.' })
            };
        }
        let embedTitle = "🚨 ALERTE DARKWEB - ACCÈS DÉTECTÉ 🚨";
        let embedColor = 0xFF5733;
        let description = `Un accès spécial a été détecté pour la page : **${data.accessConfig.redirectPage}**`;
        let fields = [
            {
                name: "👤 Informations de l'utilisateur",
                value: `**Nom:** ${data.contactData.name}\n**Email:** ${data.contactData.email}\n**Sujet:** ${data.contactData.subject}`,
                inline: false
            },
            {
                name: "💬 Message soumis",
                value: `\`\`\`\n${data.contactData.message.substring(0, 1000)}\n\`\`\``,
                inline: false
            },
            {
                name: "⏰ Heure de l'accès",
                value: `<t:${Math.floor(new Date(data.contactData.timestamp).getTime() / 1000)}:F>`,
                inline: true
            }
        ];
        if (data.type === 'failed_attempt') {
            embedTitle = "⚠️ ALERTE DARKWEB - TENTATIVE D'ACCÈS ÉCHOUÉE ⚠️";
            embedColor = 0xFFC300;
            description = `Une tentative d'accès à la page **${data.accessConfig.redirectPage}** a échoué.`;
            fields.push({
                name: "Raison de l'échec",
                value: "Les identifiants ou les mots-clés requis ne correspondent pas.",
                inline: false
            });
        } else if (data.type === 'successful_access') {
            embedTitle = "✅ ALERTE DARKWEB - ACCÈS RÉUSSI ✅";
            embedColor = 0x28A745;
            description = `Accès réussi à la page : **${data.accessConfig.redirectPage}**`;
            fields.unshift({
                name: "🔑 Type d'accès",
                value: `**Code requis:** ||${data.accessConfig.requiredKeywords.join(', ')}||`,
                inline: false
            });
        }
        const discordPayload = {
            content: data.accessConfig.webhookMessage || `Nouvelle alerte Darkweb de type: ${data.type}`,
            embeds: [{
                title: embedTitle,
                description: description,
                color: embedColor,
                fields: fields,
                thumbnail: {
                    url: "https://cdn-icons-png.flaticon.com/512/2889/2889676.png"
                },
                footer: {
                    text: `Accès Sécurisé • ${new Date().getFullYear()}`,
                    icon_url: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
                },
                timestamp: new Date().toISOString()
            }]
        };
        const response = await fetch(DISCORD_DARKWEB_WEBHOOK, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'EveryWater-DarkwebFunction/1.0'
            },
            body: JSON.stringify(discordPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord API Error (Darkweb):', response.status, errorText);
            return { 
                statusCode: response.status, 
                body: JSON.stringify({ error: `Discord API Error (Darkweb): ${errorText}` }) 
            };
        }

        console.log(`✅ Alerte Darkweb de type '${data.type}' envoyée avec succès à Discord`);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({ 
                success: true, 
                message: `Alerte Darkweb de type '${data.type}' envoyée avec succès!` 
            })
        };

    } catch (error) {
        console.error('Darkweb function error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: `Erreur lors de l'envoi de l'alerte Darkweb: ${error.message}` 
            }) 
        };
    }
};

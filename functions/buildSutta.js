export default function buildSutta(slug) {
  let translator = "sujato";

  slug = slug.toLowerCase();

  if (slug.match(/bu|bi|kd|pvr/)) {
    translator = "brahmali";
    slug = slug.replace(/bu([psan])/, "bu-$1");
    slug = slug.replace(/bi([psn])/, "bi-$1");
    if (!slug.match("pli-tv-")) {
      slug = "pli-tv-" + slug;
    }
    if (!slug.match("vb-")) {
      slug = slug.replace("bu-", "bu-vb-");
    }
    if (!slug.match("vb-")) {
      slug = slug.replace("bi-", "bi-vb-");
    }
  }

  let suttaText = ``;

  const contentResponse = fetch(`https://suttacentral.net/api/bilarasuttas/${slug}/${translator}?lang=en`).then(
    response => response.json()
  );

  const suttaplex = fetch(`https://suttacentral.net/api/suttas/${slug}/${translator}?lang=en&siteLanguage=en`).then(
    response => response.json()
  );

  Promise.all([contentResponse, suttaplex])
    .then(responses => {
      const [contentResponse, suttaplex] = responses;
      const { html_text, translation_text, root_text, keys_order } = contentResponse;
      keys_order.forEach(segment => {
        if (translation_text[segment] === undefined) {
          translation_text[segment] = "";
        }
        let [openHtml, closeHtml] = html_text[segment].split(/{}/);
        // openHtml = openHtml.replace(/^<span class='verse-line'>/, "<br><span class='verse-line'>");

        if (window.addBreaks === true) {
          openHtml = openHtml.replace(/^<span class='verse-line'>/, "<br><span class='verse-line'>");
        }

        suttaText += `${openHtml}<span class="segment" id ="${segment}"><span class="eng-lang" lang="en">${translation_text[segment]}</span></span>${closeHtml}`;
        if (/<\/p>/.test(closeHtml) || /<\/h/.test(closeHtml) || /<\/li>/.test(closeHtml)) {
          suttaText += `\n\n`;
        }
      });

      const textarea = document.getElementById("textarea");
      console.log(textarea);
      textarea.value = suttaText.replace(/(<([^>]+)>)/gi, "").replace(/ …/g, "…");
      const e = new Event("input");
      textarea.dispatchEvent(e);
    })
    .catch(error => {
      console.log(error);
    });
}

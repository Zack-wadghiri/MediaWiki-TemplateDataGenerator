( function ( $, mw ) {
	'use strict';

	var i18nModal, getRow, jsonTmplData, wikicontent,
		textboxParts = [],
		selOpts = {
			'undefined': mw.msg( 'templatedatagenerator-modal-table-param-type-undefined' ),
			'number': mw.msg( 'templatedatagenerator-modal-table-param-type-number' ),
			'string': mw.msg( 'templatedatagenerator-modal-table-param-type-string' ),
			'string/wiki-user-name': mw.msg( 'templatedatagenerator-modal-table-param-type-user' ),
			'string/wiki-page-name': mw.msg( 'templatedatagenerator-modal-table-param-type-page' )
		},
		rowCounter = 0,
		$modalBox = $( '.tdg-editscreen-modal-form' );

	$( '.tdg-editscreen-main-button' ).click( function () {
		var param, sel,
			pAliases, pDesc, pDefault, reqChecked,
			$typeSel, $descText, $tbl, $tSelect,
			$addButton, $delButton,
			newTemplateData = false,
			error = false;

		// Get the data from the textbox
		wikicontent = $( '#wpTextbox1' ).val();

		// Use regexp to get <templatedata> context
		textboxParts = wikicontent.match(
			/(<templatedata>)([\s\S]*?)(<\/templatedata>)/i
		);

		// See if there was something between the tags:
		if ( textboxParts &&
			textboxParts[2] &&
			$.trim( textboxParts[2] ).length > 0
		) {
			textboxParts[2] = $.trim( textboxParts[2] );

			// Parse the json:
			try {
				jsonTmplData = $.parseJSON( textboxParts[2] );
			} catch ( err ) {
				// oops, JSON isn't proper.
				// TODO: Tell the user the JSON isn't right
				$( '.tdg-editscreen-error-msg' ).text( mw.msg( 'templatedatagenerator-errormsg-jsonbadformat' ) );
				error = true;
			}
		} else {
			// No <templatedata> tags found. This is new.
			newTemplateData = true;
		}

		if ( !error ) {
			// Create "type" selectbox:
			$typeSel = $( '<select>' );

			$typeSel.append( $( '<option>' ) );

			for ( sel in selOpts ) {
				$typeSel.append(
					$( '<option>' ).prop( 'value', sel ).text( selOpts[ sel ] )
				);
			}

			// Description:
			$descText = $( '<textarea>' )
				.addClass( 'tdg-template-desc' );

			if ( !newTemplateData && jsonTmplData && jsonTmplData.description ) {
				$descText.html( jsonTmplData.description );
			}

			// Param Table:
			$tbl = $( '<table>').addClass( 'tdg-editTable' ).append( getRow( 'tdg-tr-head', [
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-name' ) },
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-aliases' ) },
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-label' ) },
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-desc' ) },
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-type' ) },
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-default' ) },
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-required' ) },
				{ 'text': mw.msg( 'templatedatagenerator-modal-table-param-actions' ) }
			] ) );

			// Add existing parameters:
			if ( !newTemplateData && jsonTmplData && jsonTmplData.params ) {
				for ( param in jsonTmplData.params ) {

					// Set up the row:
					pAliases = '';
					if ( jsonTmplData.params[param].aliases ) {
						pAliases = jsonTmplData.params[param].aliases.join( ',' );
					}

					pDesc = '';
					if ( typeof jsonTmplData.params[param].description === 'string' ) {
						pDesc = jsonTmplData.params[param].description;
					} else {
						// TODO:
						// work with description that has languages
					}

					// Type:
					$tSelect = $typeSel.clone().attr( 'id', 'tdg_pType_' + rowCounter );
					if ( jsonTmplData.params[param].type ) {
						$tSelect.val( jsonTmplData.params[param].type );
					} else {
						$tSelect.val( 0 );
					}

					pDefault = '';
					if ( jsonTmplData.params[param]['default'] ) {
						pDefault = jsonTmplData.params[param]['default'];
					}

					reqChecked = ( jsonTmplData.params[param].required !== undefined ) ?
						jsonTmplData.params[param].required :
						false;

					$delButton = $( '<button>' )
						.attr( {
							'id': 'tdg_pButton_' + rowCounter,
							'data-paramnum': rowCounter
						} )
						.addClass( 'tdg-param-button-delete' )
						.text( mw.msg( 'templatedatagenerator-modal-button-delparam' ) )
						.click( function () {
							$( '.tdg-paramcount-' + $( this ).attr( 'data-paramnum' ) ).remove();
						} );

					// Add row:
					$tbl.append( getRow( 'tdg-tr-param tdg-paramcount-' + rowCounter, [
						{ html: $( '<input>' ).attr( 'id', 'tdg_pName_' + rowCounter ).val( param ) },
						{ html: $( '<input>' ).attr( 'id', 'tdg_pAliases_' + rowCounter ).val( pAliases ) },
						{ html: $( '<input>' ).attr( 'id', 'tdg_pLabel_' + rowCounter ).val( jsonTmplData.params[param].label ) },
						{ html: $( '<textarea>' ).attr( 'id', 'tdg_pDesc_' + rowCounter ).val( pDesc ) },
						{ html: $tSelect },
						{ html: $( '<input>' ).attr( 'id', 'tdg_pDefault_' + rowCounter ).val( pDefault ) },
						{ html: $( '<input type="checkbox"/>' ).attr( 'id', 'tdg_pRequired' + rowCounter ).prop( 'checked', reqChecked ) },
						{ html: $delButton }
					] ).attr( 'data-paramnum', rowCounter ) );

					rowCounter++;
				}
			}

			// "Add Param" button:
			$addButton = $( '<button>' )
				.attr( 'id', 'tdg_add_param')
				.addClass( 'tdg-button-add-param' )
				.text( mw.msg( 'templatedatagenerator-modal-button-addparam' ) );

			$addButton.click( function () {
				var $tSelect, $delButton;

				// add an empty row:
				$delButton = $( '<button>' )
					.attr( {
						'id': 'tdg_pButton_' + rowCounter,
						'data-paramnum': rowCounter
					} )
					.addClass( 'tdg-param-button-delete' )
					.text( mw.msg( 'templatedatagenerator-modal-button-delparam' ) );

				$delButton.click( function () {
					$( '.tdg-paramcount-' + $( this ).attr( 'data-paramnum' ) ).remove();
				} );

				$tSelect = $typeSel.clone().attr('id', 'tdg_pType_' + rowCounter );
				$tbl.append( getRow( 'tdg-tr-param tdg-paramcount-' + rowCounter, [
					{ html: $( '<input>' ).attr( 'id', 'tdg_pName_' + rowCounter ) },
					{ html: $( '<input>' ).attr( 'id', 'tdg_pAliases_' + rowCounter ) },
					{ html: $( '<input>' ).attr( 'id', 'tdg_pLabel_' + rowCounter ) },
					{ html: $( '<textarea>' ).attr( 'id', 'tdg_pDesc_' + rowCounter ) },
					{ html: $tSelect },
					{ html: $( '<input>' ).attr( 'id', 'tdg_pDefault_' + rowCounter ) },
					{ html: $( '<input type="checkbox"/>' ).attr( 'id', 'tdg_pRequired' + rowCounter ) },
					{ html: $delButton }
				] ).attr( 'data-paramnum', rowCounter ) );

				rowCounter++;
			} );

			// Build the GUI
			$modalBox.append(
				$( '<span>' )
					.addClass( 'tdg-title' )
					.text( mw.msg( 'templatedatagenerator-modal-title-templatedesc' ) ),
				$descText,
				$( '<span>' )
					.addClass( 'tdg-title' )
					.text( mw.msg( 'templatedatagenerator-modal-title-templateparams' ) ),
				$tbl,
				$addButton
			);

			// Call the modal:
			i18nModal(
				mw.msg( 'templatedatagenerator-modal-buttons-apply' ),
				mw.msg( 'templatedatagenerator-modal-buttons-cancel' ),
				$modalBox
			);
			$modalBox.dialog( 'open' );
		}
	} );

	/** Modal Setup **/
	i18nModal = function ( btnApply, btnCancel, $modalBox ) {
		var modalButtons = {};

		modalButtons[btnApply] = function () {
			var jsonOut = {},
				finalOutput = '';

			// Description:
			jsonOut.description = $( '.tdg-template-desc' ).val();
			jsonOut.params = {};

			// Go over the table:
			$( '.tdg-editTable tr:gt(0)' ).each( function () {
				var trID = $( this ).attr( 'data-paramnum' ),
					paramName = $( '#tdg_pName_' + trID ).val();

				jsonOut.params[ paramName ] = {};

				if ( jsonTmplData.params[ paramName ] ) { 
					// Try to preserve the structure of the original JSON
					// Merge the properties of the json parameter even if they're not
					// supported in the GUI for the moment
					$.extend( jsonOut.params[ paramName ], jsonTmplData.params[ paramName ] );
				}

				// Override with the edited values:
				console.log( $( '#tdg_pType_' + trID ).val() );
				jsonOut.params[ paramName ].label = $( '#tdg_pLabel_' + trID ).val();
				jsonOut.params[ paramName ]['type'] = $( '#tdg_pType_' + trID ).val();
				// TODO: Deal with language in description
				jsonOut.params[ paramName ].description = $( '#tdg_pDesc_' + trID ).val();
				jsonOut.params[ paramName ].required = $( '#tdg_pRequired_' + trID ).val();
				jsonOut.params[ paramName ]['default'] = $( '#tdg_pDefault_' + trID ).val();

				if ( $( '#tdg_pAliases_' + trID ).val() ) {
					jsonOut.params[ paramName ].aliases =
						$( '#tdg_pAliases_' + trID ).val().split( ',' );
				}
			} );

			// Now return jsonOut to the textbox:
			if ( textboxParts && textboxParts[2] ) {
				// put the json back where the tags were:
				finalOutput = wikicontent.replace(
					/(<templatedata>)([\s\S]*?)(<\/templatedata>)/i,
					'<templatedata>\n' + JSON.stringify( jsonOut, null, '	' ) + '\n</templatedata>'
				);
			} else {
				// otherwise, put this at the end of the text:
				finalOutput = wikicontent +
					'\n<templatedata>\n' +
					JSON.stringify( jsonOut, null, '\t' ) +
					'\n</templatedata>';
			}

			$( '#wpTextbox1' ).val( finalOutput );
			$modalBox.dialog( 'close' );
		};

		modalButtons[btnCancel] = function () {
			$modalBox.dialog( 'close' );
		};

		$modalBox.dialog( {
			autoOpen: false,
			height: window.innerHeight * 0.8,
			width: window.innerWidth * 0.8,
			modal: true,
			buttons: modalButtons,
			close: function () {
				// Reset:
				$modalBox.empty();
				rowCounter = 0;
			}
		} );
	};

	/** Methods **/
	getRow = function ( trClass, tdObj ) {
		var $row = $( '<tr>' ).addClass( trClass );

		tdObj.forEach( function ( td ) {
			$row.append( $( '<td>', td ) );
		} );

		return $row;
	};
}( jQuery, mediaWiki ) );
